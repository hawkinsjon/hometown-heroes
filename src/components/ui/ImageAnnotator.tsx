import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

type ImageAnnotatorProps = {
  imageUrl: string;
  onSave: (annotation: string) => void;
  onCancel: () => void;
};

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  onSave,
  onCancel
}) => {
  const [annotation, setAnnotation] = useState<string>('');
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!containerRef.current || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMarkerPosition({ x, y });
  };
  
  const handleSave = () => {
    if (!markerPosition) {
      onSave(annotation);
      return;
    }
    
    const formattedAnnotation = annotation 
      ? `${annotation} [Marked position: ${markerPosition.x.toFixed(1)}%, ${markerPosition.y.toFixed(1)}%]` 
      : `Veteran is located at position: ${markerPosition.x.toFixed(1)}%, ${markerPosition.y.toFixed(1)}%`;
    
    onSave(formattedAnnotation);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
        <p className="text-blue-800">
          If there are multiple people in this photo, please identify which person is the veteran by clicking on them.
          You can also add any notes about the photo below.
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden relative" ref={containerRef}>
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Veteran" 
          className="max-w-full h-auto cursor-crosshair"
          onClick={handleImageClick}
        />
        
        {markerPosition && (
          <div 
            className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 rounded-full border-2 border-white shadow-lg opacity-70"
            style={{ 
              left: `${markerPosition.x}%`, 
              top: `${markerPosition.y}%`,
              zIndex: 10 
            }}
          />
        )}
      </div>
      
      <div>
        <label 
          htmlFor="annotation" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes about the photo (optional)
        </label>
        <textarea
          id="annotation"
          rows={3}
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          placeholder="Example: The veteran is wearing a blue uniform, this was taken during basic training in 1967"
          className="w-full rounded-md shadow-sm border-gray-300 focus:border-navy-500 focus:ring-navy-500"
        />
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Identification
        </Button>
      </div>
    </div>
  );
};