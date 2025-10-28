import { analyzeImageQuality } from './api/visionApi';

// Mock analysis for development
const mockAnalysis = async (file: File): Promise<{
  isValid: boolean;
  hasFaces: boolean;
  faceCount: number;
  resolution: { width: number; height: number };
  qualityScore: number;
  issues?: string[];
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Get image dimensions
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = function() {
      URL.revokeObjectURL(objectUrl);
      
      // Random quality assessment for demo
      const width = img.width;
      const height = img.height;
      const isValidResolution = width >= 1200 && height >= 1600;
      const hasFaces = Math.random() > 0.2; // 80% chance of having faces
      const faceCount = hasFaces ? Math.floor(Math.random() * 3) + 1 : 0;
      
      // Simulate quality issues for smaller images
      const qualityScore = isValidResolution ? 0.8 : 0.4;
      const isValid = qualityScore > 0.6;
      
      const issues = !isValid ? [
        'Resolution is too low for banner printing',
        'Image may appear blurry when enlarged',
      ] : undefined;
      
      resolve({
        isValid,
        hasFaces,
        faceCount,
        resolution: { width, height },
        qualityScore,
        issues
      });
    };
    
    img.src = objectUrl;
  });
};

export const analyzeImage = async (file: File) => {
  try {
    const result = await mockAnalysis(file);
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};