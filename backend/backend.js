import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
const resultsDir = path.join(__dirname, 'results');
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendDistPath));
app.use('/results', express.static(resultsDir));

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.post('/api/generate-ads', upload.array('image', 5), async (req, res) => {
  try {
    const { productName, guidancePrompt, numberOfAds = 1 } = req.body;
    const imageFiles = req.files;

    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    if (!productName || !guidancePrompt) {
      return res.status(400).json({ success: false, message: 'Product name and guidance prompt are required' });
    }

    const numAds = Math.min(5, Math.max(1, parseInt(numberOfAds) || 1));
    const completePrompt = `Generate a photorealistic ad image for "${productName}" with the following guidance: ${guidancePrompt}`;

    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('prompt', completePrompt);
    form.append('n', numAds.toString());
    form.append('size', '1024x1024');

    // Attach all uploaded images as references
    imageFiles.forEach((file) => {
      form.append('image[]', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
      });
    });

    console.log('Calling OpenAI GPT-Image-1 API...');
    const openaiResponse = await axios.post('https://api.openai.com/v1/images/edits', form, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
    });

    const generatedImageUrls = [];

    for (const imgData of openaiResponse.data.data) {
      if (!imgData.b64_json) continue;

      const imgBuffer = Buffer.from(imgData.b64_json, 'base64');
      const filename = `${uuidv4()}.png`;
      const filePath = path.join(resultsDir, filename);
      fs.writeFileSync(filePath, imgBuffer);

      generatedImageUrls.push(`/results/${filename}`);
    }

    // Clean up uploaded files
    imageFiles.forEach(file => fs.unlinkSync(file.path));

    return res.status(200).json({
      success: true,
      images: generatedImageUrls,
      count: generatedImageUrls.length,
    });
  } catch (error) {
    console.error('Error generating ad images:', error);

    if (error.response?.data?.error?.message) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: error.response.data.error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating ad images',
    });
  }
});

// Catch-all GET route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads: ${uploadsDir}`);
  console.log(`📁 Results: ${resultsDir}`);
});

export default app;
