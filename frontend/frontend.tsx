import { useState } from "react";
import { Loader2, Upload, Check, X, AlertTriangle } from "lucide-react";

export default function AdImageGenerator() {
  // Form state
  const [step, setStep] = useState(1);
  const [productName, setProductName] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [guidancePrompt, setGuidancePrompt] = useState("");
  const [numberOfAds, setNumberOfAds] = useState(1);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  
  // Image validation
  const validateImage = (file) => {
    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return "Only JPG and PNG files are allowed";
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB";
    }
    
    return null;
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding these files would exceed the 5 image limit
    if (uploadedImages.length + files.length > 5) {
      setError("You can upload a maximum of 5 images");
      return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        setError(error);
        return;
      }
      validFiles.push(file);
    }
    
    // Add valid files to state with preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setUploadedImages([...uploadedImages, ...newImages]);
    setError("");
  };
  
  // Remove an uploaded image
  const removeImage = (index) => {
    const newImages = [...uploadedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, index + 1);
    setUploadedImages(newImages);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("guidancePrompt", guidancePrompt);
      formData.append("numberOfAds", numberOfAds);
      
      // Append all images
      uploadedImages.forEach((img) => {
        formData.append(`image`, img.file);
      });
      
      // Send request to backend
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
      setStep(4); // Move to results step
      
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Next step validation
  const canProceedToStep2 = productName.trim() !== "";
  const canProceedToStep3 = uploadedImages.length > 0;
  const canSubmit = guidancePrompt.trim() !== "" && numberOfAds > 0 && numberOfAds <= 5;
  
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-6 rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Ad Image Generator</h1>
      
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div 
            key={stepNumber}
            className={`flex flex-col items-center ${stepNumber <= step ? "text-blue-600" : "text-gray-400"}`}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                ${stepNumber < step ? "bg-blue-600 text-white" : 
                  stepNumber === step ? "border-2 border-blue-600" : "border-2 border-gray-300"}`}
            >
              {stepNumber < step ? <Check size={16} /> : stepNumber}
            </div>
            <span className="text-xs">
              {stepNumber === 1 ? "Product Info" : 
               stepNumber === 2 ? "Upload Images" : 
               stepNumber === 3 ? "Guidance" : "Results"}
            </span>
          </div>
        ))}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600">
          <AlertTriangle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Step 1: Product Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your product name"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Product Images */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Images (up to 5 JPG/PNG files, max 5MB each)
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
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
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload size={24} className="text-gray-500 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload images</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {uploadedImages.length}/5 images uploaded
                  </span>
                </label>
              </div>
              
              {/* Preview uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={img.preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Guidance and Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Guidance Prompt</label>
              <textarea
                value={guidancePrompt}
                onChange={(e) => setGuidancePrompt(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how you want your ad to look"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Ads to Generate (1-5)
              </label>
              <input
                type="number"
                value={numberOfAds}
                onChange={(e) => setNumberOfAds(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1"
                max="5"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center disabled:bg-gray-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : "Generate Ad Images"}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Results */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Generated Ad Images</h2>
            
            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {generatedImages.map((img, index) => (
                  <div key={index} className="border rounded-md overflow-hidden">
                    <img 
                      src={img} 
                      alt={`Generated Ad ${index + 1}`}
                      className="w-full aspect-square object-contain"
                    />
                    <div className="p-2 bg-gray-50 border-t flex justify-between">
                      <span className="text-sm text-gray-600">Ad {index + 1}</span>
                      <a 
                        href={img} 
                        download={`ad-${productName}-${index+1}.png`}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 border rounded-md flex flex-col items-center justify-center text-gray-500">
                <Upload size={48} className="mb-2 opacity-30" />
                <p>No images generated yet</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setProductName("");
                  setUploadedImages([]);
                  setGuidancePrompt("");
                  setNumberOfAds(1);
                  setGeneratedImages([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Create New Ad
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}