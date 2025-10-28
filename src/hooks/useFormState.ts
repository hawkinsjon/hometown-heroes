import { useState } from 'react';

// Format a name to ensure proper capitalization (title case)
export const formatName = (name: string): string => {
  if (!name) return '';
  
  // Split by spaces, hyphens, and apostrophes while preserving them
  return name
    .split(/(?=['\s-])|(?<=['\s-])/)
    .map((part, i, arr) => {
      // Skip spaces and punctuation
      if (/^['\s-]$/.test(part)) return part;
      
      // Handle prefixes like "Mc" or "Mac"
      if (/^(mc|mac)$/i.test(part) && i < arr.length - 1) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      
      // For regular words, capitalize first letter
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
};

// Define a type for photo data - simplified to remove crop info
export interface PhotoData {
  id: string;             // Unique ID for React keys
  objectKey?: string;      // Key of the object in DigitalOcean Spaces
  filename?: string;       // Original filename
  contentType?: string;    // MIME type of the file
  previewUrl?: string;     // Optional: For local blob URL previews before/during upload
  publicUrl?: string;      // Permanent URL on DO Spaces
  file?: File; // Temporary, should be removed after upload logic is solid
  isEmblem?: boolean;      // New flag
}

export interface FormDataType {
  sponsorName: string;
  sponsorEmail: string;
  relationshipToVeteran: string;
  veteranName: string;
  veteranAddress: string;
  veteranYearsInBH: string;
  veteranBHConnection: string;
  serviceBranch: string;
  isReserve: boolean;
  servicePeriodOrConflict: string;
  photos: PhotoData[]; // Array of photos (now can be multiple)
  consentGiven: boolean;
  submitted: boolean;
  unknownBranchInfo?: string;
  unknownBranchAudio?: string;
}

const initialFormData: FormDataType = {
  sponsorName: '',
  sponsorEmail: '',
  relationshipToVeteran: '',
  veteranName: '',
  veteranAddress: '',
  veteranYearsInBH: '',
  veteranBHConnection: '',
  serviceBranch: '',
  isReserve: false,
  servicePeriodOrConflict: '',
  photos: [], // Initial value is an empty array
  consentGiven: false,
  submitted: false
};

export const useFormState = () => {
  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  const updateFormData = (updates: Partial<FormDataType>) => {
       setFormData(prev => ({
        ...prev,
        ...updates
      }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    updateFormData,
    resetForm
  };
};