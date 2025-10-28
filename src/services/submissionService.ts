import { FormDataType } from '../hooks/useFormState';
import { sendConfirmationEmail } from './emailService';

// In a real implementation, this would submit to a backend API
export const submitBannerRequest = async (formData: FormDataType): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Mock successful submission
    const submissionId = generateSubmissionId();
    
    // Send confirmation email
    await sendConfirmationEmail(formData, submissionId);
    
    return submissionId;
  } catch (error) {
    console.error('Error submitting banner request:', error);
    throw error;
  }
};

// Generate a random submission ID
const generateSubmissionId = (): string => {
  return 'BH' + Math.floor(100000 + Math.random() * 900000).toString();
};