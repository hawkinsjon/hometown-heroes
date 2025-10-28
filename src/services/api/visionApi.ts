export const analyzeImageQuality = async (file: File): Promise<{
  isValid: boolean;
  hasFaces: boolean;
  faceCount: number;
  resolution: { width: number; height: number };
  qualityScore: number;
  issues?: string[];
}> => {
  throw new Error('API not implemented yet');
};