import React from 'react';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { CheckCircle, Mail, Flag } from 'lucide-react';

type ConfirmationStepProps = {
  formData: FormDataType;
  onReset: () => void;
};

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ 
  formData,
  onReset
}) => {
  const submissionId = formData.submissionId || '12345678'; // Fallback ID for demo
  
  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle size={48} className="text-green-600" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-navy-900">Thank You!</h3>
      
      <p className="text-lg">
        Your banner request for <span className="font-semibold">{formData.veteranName}</span> has been submitted successfully.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-blue-800 text-left max-w-md mx-auto">
        <h4 className="font-semibold flex items-center mb-2">
          <Mail className="mr-2 h-4 w-4" />
          Confirmation Email Sent
        </h4>
        <p className="text-sm">
          A confirmation email has been sent to <span className="font-medium">{formData.submitterEmail}</span> with details about your submission.
        </p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-w-md mx-auto">
        <p className="text-sm text-gray-600 mb-2">Your submission reference number:</p>
        <p className="text-xl font-mono font-bold">{submissionId}</p>
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <p className="text-gray-700">What happens next?</p>
        <ol className="text-left text-sm space-y-2 px-4">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center rounded-full bg-navy-100 text-navy-800 h-5 w-5 text-xs mr-2 mt-0.5">1</span>
            <span>Our committee will review your submission within 2-3 business days.</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center rounded-full bg-navy-100 text-navy-800 h-5 w-5 text-xs mr-2 mt-0.5">2</span>
            <span>If approved, your banner will be printed and ready for the next display period (Memorial Day or Veterans Day).</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center rounded-full bg-navy-100 text-navy-800 h-5 w-5 text-xs mr-2 mt-0.5">3</span>
            <span>You'll receive an email notification when your banner has been installed in Berkeley Heights.</span>
          </li>
        </ol>
      </div>
      
      <div className="pt-4">
        <Button 
          type="button" 
          onClick={onReset}
          variant="outline"
          className="flex items-center mx-auto"
        >
          <Flag className="mr-2 h-4 w-4" />
          Submit Another Banner
        </Button>
      </div>
      
      <p className="text-sm text-gray-500 pt-4">
        Questions? Contact the Berkeley Heights Veterans Committee at <a href="mailto:veterans@berkeleyheights.gov" className="text-navy-600 hover:underline">veterans@berkeleyheights.gov</a>
      </p>
    </div>
  );
};