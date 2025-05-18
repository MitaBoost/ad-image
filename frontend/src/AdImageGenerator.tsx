import React from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Loader2, Upload, Check, X, AlertTriangle } from "lucide-react";

type UploadedImage = {
  file: File;
  preview: string;
};

export default function AdImageGenerator() {
  const [step, setStep] = useState<number>(1);
  const [productName, setProductName] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [guidancePrompt, setGuidancePrompt] = useState<string>("");
  const [numberOfAds, setNumberOfAds] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const validateImage = (file: File): string | null => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return "Only JPG and PNG files are allowed";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB";
    }
    return null;
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (uploadedImages.length + files.length > 5) {
      setError("You can upload a maximum of 5 images");
      return;
    }
    const validFiles: UploadedImage[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        setError(error);
        return;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }
    setUploadedImages([...uploadedImages, ...validFiles]);
    setError("");
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("guidancePrompt", guidancePrompt);
      formData.append("numberOfAds", numberOfAds.toString());
      uploadedImages.forEach((img) => {
        formData.append("image", img.file);
      });
      const response = await fetch("/api/generate-ads", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate images");
      }
      const data = await response.json();
      setGeneratedImages(data.images);
      setStep(4);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = productName.trim() !== "";
  const canProceedToStep3 = uploadedImages.length > 0;
  const canSubmit = guidancePrompt.trim() !== "" && numberOfAds > 0 && numberOfAds <= 5;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6">
        <h1 className="text-center text-2xl font-bold mb-4">Generate Your Ad Images</h1>
        <div className="w-full h-1 bg-gray-200 rounded-full mb-6">
          <div className={`h-1 bg-blue-600 rounded-full`} style={{ width: `${(step - 1) * 33.3}%` }}></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
            <AlertTriangle size={18} className="mr-2" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Step 1: Product Details</h2>
            <label className="text-sm font-medium">Product Name</label>
            <input
              type="text"
              className="mt-1 w-full border border-gray-300 rounded-md p-2"
              placeholder="e.g., Premium Coffee Beans"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:bg-gray-400"
                disabled={!canProceedToStep2}
                onClick={() => setStep(2)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Step 2: Upload Product Images</h2>
            <label className="text-sm">Product Images (up to 5, JPG/PNG, max 5MB each)</label>
            <div className="mt-2 mb-4">
              <input
                type="file"
                id="image-upload"
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png"
                multiple
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="bg-blue-600 text-white px-5 py-2 rounded-md cursor-pointer inline-block"
              >
                Choose Files
              </label>
            </div>
            <div>
              {uploadedImages.map((img, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 border rounded-md px-4 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img src={img.preview} alt="preview" className="h-10 w-10 object-cover rounded" />
                    <div>
                      <p className="text-sm font-medium truncate w-48">{img.file.name}</p>
                      <p className="text-xs text-gray-500">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-md border border-gray-400"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white px-5 py-2 rounded-md disabled:bg-gray-400"
                disabled={!canProceedToStep3}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Step 3: Ad Specifics</h2>
            <label className="text-sm font-medium">Guidance Prompt</label>
            <textarea
              className="w-full border mt-1 border-gray-300 rounded-md p-2"
              rows={4}
              value={guidancePrompt}
              placeholder="e.g., Show the product on a wooden table with a blurred background, morning light."
              onChange={(e) => setGuidancePrompt(e.target.value)}
            />
            <label className="text-sm font-medium mt-4 block">Number of Ads to Generate</label>
            <select
              value={numberOfAds}
              onChange={(e) => setNumberOfAds(parseInt(e.target.value))}
              className="w-full mt-1 border border-gray-300 rounded-md p-2"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-md border border-gray-400"
              >
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-green-600 text-white px-5 py-2 rounded-md flex items-center justify-center disabled:bg-gray-400"
              >
                {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={16} />Generating...</> : "Generate Ads"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
