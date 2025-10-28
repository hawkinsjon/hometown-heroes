import React from 'react';
import { UploadCloud } from 'lucide-react';

type ImageDropzoneProps = {
  onFileSelected: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  error: string | null;
};

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onFileSelected,
  fileInputRef,
  error
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging 
          ? 'border-navy-500 bg-navy-50' 
          : error
          ? 'border-red-300 bg-red-50'
          : 'border-gray-300 hover:bg-gray-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <UploadCloud 
            size={48} 
            className={`${
              error ? 'text-red-500' : 'text-navy-500'
            }`} 
          />
        </div>
        
        <div>
          <p className="text-lg font-medium">
            Drag and drop your photo here
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Or click to browse your files
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          JPG, PNG or HEIC up to 10MB
        </div>
        
        {error && (
          <div className="text-sm text-red-600 font-medium">
            {error}
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => onFileSelected(e.target.files ? e.target.files[0] : null)}
      />
    </div>
  );
};