import React, { useState, useRef } from 'react';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { ImageDropzone } from '../ui/ImageDropzone';
import { ImageAnnotator } from '../ui/ImageAnnotator';
import { Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { analyzeImage } from '../../services/imageAnalysis';

type PhotoUploadStepProps = {
  formData: FormDataType;
  updateFormData: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
};

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({ 
  formData, 
  updateFormData, 
  onNext,
  onBack
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/heic'].includes(file.type.toLowerCase())) {
      setError('Please upload a JPG, PNG, or HEIC image.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    
    try {
      const imageUrl = URL.createObjectURL(file);
      updateFormData({ 
        photoFile: file,
        photoUrl: imageUrl,
        photoIsValid: undefined
      });
      
      // Analyze the image
      const analysisResult = await analyzeImage(file);
      
      updateFormData({ 
        photoIsValid: analysisResult.isValid,
        photoAnnotation: ''
      });
      
      if (analysisResult.isValid && analysisResult.hasFaces && analysisResult.faceCount > 1) {
        setShowAnnotator(true);
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('There was an error analyzing your image. Please try again.');
      updateFormData({ photoIsValid: false });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnnotationSave = (annotation: string) => {
    updateFormData({ photoAnnotation: annotation });
    setShowAnnotator(false);
  };

  const handleContinue = () => {
    if (!formData.photoFile || formData.photoIsValid === false) {
      setError('Please upload a valid photo before continuing.');
      return;
    }
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500 mb-6">
        <p className="text-blue-800">
          Please upload a high-quality photo of the veteran. The photo will be displayed on the banner, so it should be clear and well-lit.
        </p>
        <ul className="text-blue-800 mt-2 list-disc list-inside text-sm">
          <li>Portrait-style photos work best</li>
          <li>Minimum resolution: 1200x1600 pixels</li>
          <li>Military uniform photos are preferred but not required</li>
          <li>File formats: JPG, PNG, or HEIC</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>
      
      {!showAnnotator ? (
        <div className="space-y-6">
          {formData.photoUrl ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative border rounded-md overflow-hidden max-w-md mx-auto">
                <img 
                  src={formData.photoUrl} 
                  alt="Veteran" 
                  className="max-w-full h-auto"
                />
                
                {formData.photoIsValid === true && (
                  <div className="absolute top-0 right-0 m-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                )}
                
                {formData.photoIsValid === false && (
                  <div className="absolute top-0 right-0 m-2 bg-red-500 text-white p-1 rounded-full">
                    <AlertTriangle size={24} />
                  </div>
                )}
              </div>
              
              {isAnalyzing && (
                <div className="text-center">
                  <div className="animate-pulse flex space-x-2 justify-center items-center">
                    <div className="h-2 w-2 bg-navy-600 rounded-full"></div>
                    <div className="h-2 w-2 bg-navy-600 rounded-full"></div>
                    <div className="h-2 w-2 bg-navy-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Analyzing image quality...</p>
                </div>
              )}
              
              {formData.photoIsValid === true && (
                <div className="bg-green-50 p-3 rounded border border-green-200 text-green-800 text-center">
                  <p className="font-medium">This photo meets our quality requirements!</p>
                </div>
              )}
              
              {formData.photoIsValid === false && (
                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-800">
                  <p className="font-medium text-center">This photo doesn't meet our quality requirements</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>The resolution may be too low for a large banner</li>
                    <li>The image may be blurry or poorly lit</li>
                    <li>The veteran's face may not be clearly visible</li>
                  </ul>
                  <p className="mt-2 text-sm">Please upload a different photo or contact us for assistance.</p>
                </div>
              )}
              
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center"
                variant="outline"
              >
                <Upload size={16} className="mr-2" />
                Choose Different Photo
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
              />
            </div>
          ) : (
            <ImageDropzone
              onFileSelected={handleFileChange}
              fileInputRef={fileInputRef}
              error={error}
            />
          )}
          
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
            <Button 
              type="button" 
              onClick={handleContinue}
              disabled={isAnalyzing || formData.photoIsValid === false || !formData.photoFile}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <ImageAnnotator
          imageUrl={formData.photoUrl || ''}
          onSave={handleAnnotationSave}
          onCancel={() => setShowAnnotator(false)}
        />
      )}
    </div>
  );
};