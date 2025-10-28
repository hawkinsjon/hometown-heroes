import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, Check, Crop } from 'lucide-react';
import { Button } from './Button';

interface DocumentScannerProps {
  imageFile: File;
  onProcessed: (processedBlob: Blob) => void;
  onCancel: () => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ 
  imageFile, 
  onProcessed, 
  onCancel 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for manual cropping
  const [cropStartX, setCropStartX] = useState<number | null>(null);
  const [cropStartY, setCropStartY] = useState<number | null>(null);
  const [cropEndX, setCropEndX] = useState<number | null>(null);
  const [cropEndY, setCropEndY] = useState<number | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create an image from the file
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        
        img.onload = () => {
          setOriginalImage(img);
          
          // Initialize canvas with the image
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, img.width, img.height);
            }
          }
          
          setIsLoading(false);
        };
        
        img.onerror = () => {
          setError('Failed to load image. Please try again with a different file.');
          setIsLoading(false);
        };
      } catch (err) {
        console.error('Error processing image:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    };
    
    loadImage();
    
    return () => {
      // Clean up the object URL when component unmounts
      if (originalImage?.src) {
        URL.revokeObjectURL(originalImage.src);
      }
    };
  }, [imageFile]);
  
  // Handle mouse events for cropping
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate position relative to canvas and scale to actual canvas size
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCropStartX(x);
    setCropStartY(y);
    setCropEndX(null);
    setCropEndY(null);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || cropStartX === null || cropStartY === null) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate position relative to canvas and scale to actual canvas size
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCropEndX(x);
    setCropEndY(y);
    
    // Redraw the canvas with the cropping rectangle
    redrawCanvas();
  };
  
  const handleMouseUp = () => {
    if (!isCropping || cropStartX === null || cropStartY === null || cropEndX === null || cropEndY === null) return;
    
    // Cropping is complete
    setIsCropping(false);
  };
  
  // Function to redraw the canvas with the crop overlay
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !originalImage) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Draw the cropping rectangle if we have start and end points
    if (cropStartX !== null && cropStartY !== null && cropEndX !== null && cropEndY !== null) {
      const width = cropEndX - cropStartX;
      const height = cropEndY - cropStartY;
      
      // Draw semi-transparent overlay for the non-selected area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear the selected area to show it normally
      ctx.clearRect(cropStartX, cropStartY, width, height);
      
      // Draw a border around the selected area
      ctx.strokeStyle = '#FFCC00';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropStartX, cropStartY, width, height);
      
      // Draw handles at the corners
      const handleSize = 8;
      ctx.fillStyle = '#FFCC00';
      
      // Top-left
      ctx.fillRect(cropStartX - handleSize/2, cropStartY - handleSize/2, handleSize, handleSize);
      // Top-right
      ctx.fillRect(cropEndX - handleSize/2, cropStartY - handleSize/2, handleSize, handleSize);
      // Bottom-left
      ctx.fillRect(cropStartX - handleSize/2, cropEndY - handleSize/2, handleSize, handleSize);
      // Bottom-right
      ctx.fillRect(cropEndX - handleSize/2, cropEndY - handleSize/2, handleSize, handleSize);
    }
  };
  
  // Start cropping
  const startCropping = () => {
    setIsCropping(true);
    setCropStartX(null);
    setCropStartY(null);
    setCropEndX(null);
    setCropEndY(null);
    
    // Reset the canvas with just the image
    if (canvasRef.current && originalImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  // Apply the crop
  const applyCrop = () => {
    if (cropStartX === null || cropStartY === null || cropEndX === null || cropEndY === null) {
      setError('Please select an area to crop first');
      return;
    }
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx || !originalImage) {
        setError('Failed to create canvas context');
        return;
      }
      
      // Calculate the coordinates ensuring the correct orientation (start < end)
      const startX = Math.min(cropStartX, cropEndX);
      const startY = Math.min(cropStartY, cropEndY);
      const width = Math.abs(cropEndX - cropStartX);
      const height = Math.abs(cropEndY - cropStartY);
      
      // Set canvas size to the cropped area
      canvas.width = width;
      canvas.height = height;
      
      // Draw only the cropped portion
      ctx.drawImage(
        originalImage,
        startX, startY, width, height,  // Source rectangle
        0, 0, width, height             // Destination rectangle
      );
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onProcessed(blob);
        } else {
          setError('Failed to create image from crop');
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Error applying crop:', err);
      setError('Failed to crop the image');
    }
  };
  
  // Use the original image without cropping
  const useOriginalImage = () => {
    if (!originalImage) return;
    
    try {
      // Create a canvas with the original image
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }
      
      // Draw the image on the canvas
      ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
      
      // Convert to blob and process
      canvas.toBlob((blob) => {
        if (blob) {
          onProcessed(blob);
        } else {
          setError('Failed to convert original image. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Error using original image:', err);
      setError('Failed to use the original image. Please try again.');
    }
  };
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-4">Document Scanner</h2>
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-marine-gold-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading image...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="text-red-400 mr-2 h-5 w-5 mt-0.5" />
            <span className="text-red-100">{error}</span>
          </div>
        </div>
      )}
      
      {originalImage && !isLoading && (
        <div className="space-y-4">
          <div className="bg-black rounded-md p-2 overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-[400px] mx-auto object-contain cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isCropping ? (
              <>
                <Button 
                  onClick={() => setIsCropping(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto"
                >
                  Cancel Crop
                </Button>
                
                <Button 
                  onClick={applyCrop}
                  className="bg-marine-gold-500 hover:bg-marine-gold-400 text-black w-full sm:w-auto"
                  disabled={!(cropStartX !== null && cropEndX !== null)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply Crop
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={onCancel}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-full sm:w-auto"
                >
                  Cancel
                </Button>
                
                <Button 
                  onClick={startCropping}
                  className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto"
                >
                  <Crop className="mr-2 h-4 w-4" />
                  Crop Photo
                </Button>
                
                <Button 
                  onClick={useOriginalImage}
                  className="bg-marine-gold-500 hover:bg-marine-gold-400 text-black w-full sm:w-auto"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use As Is
                </Button>
              </>
            )}
          </div>
          
          {isCropping && (
            <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded-md text-blue-100 text-sm">
              <p>Draw a rectangle around the photo by clicking and dragging.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentScanner; 