import React, { useState } from 'react';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { CheckCircle, Mail } from 'lucide-react';
import { submitBannerRequest } from '../../services/submissionService';

type ReviewStepProps = {
  formData: FormDataType;
  onNext: () => void;
  onBack: () => void;
};

export const ReviewStep: React.FC<ReviewStepProps> = ({ 
  formData,
  onNext,
  onBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getServiceBranchLabel = (value: string) => {
    const branches: Record<string, string> = {
      'army': 'Army',
      'navy': 'Navy',
      'air_force': 'Air Force',
      'marines': 'Marine Corps',
      'coast_guard': 'Coast Guard',
      'space_force': 'Space Force',
      'national_guard': 'National Guard'
    };
    return branches[value] || value;
  };
  
  const getWarEraLabel = (value: string) => {
    const eras: Record<string, string> = {
      'wwii': 'World War II (1939-1945)',
      'korea': 'Korean War (1950-1953)',
      'vietnam': 'Vietnam War (1955-1975)',
      'persian_gulf': 'Persian Gulf War (1990-1991)',
      'afghanistan': 'Afghanistan War (2001-2021)',
      'iraq': 'Iraq War (2003-2011)',
      'other': 'Other Conflict',
      'peacetime': 'Peacetime Service'
    };
    return eras[value] || 'Not specified';
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await submitBannerRequest(formData);
      onNext();
    } catch (err) {
      console.error('Submission error:', err);
      setError('There was an error submitting your request. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500 mb-6">
        <p className="text-blue-800">
          Please review all information below before submitting your banner request.
        </p>
      </div>
      
      <div className="space-y-8">
        <section className="border-b pb-6">
          <h3 className="text-lg font-semibold text-navy-800 mb-4">Your Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{formData.submitterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{formData.submitterEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{formData.submitterPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Relationship to Veteran</p>
              <p className="font-medium">{formData.submitterRelationship}</p>
            </div>
          </div>
        </section>
        
        <section className="border-b pb-6">
          <h3 className="text-lg font-semibold text-navy-800 mb-4">Veteran Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{formData.veteranName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address (past or present)</p>
              <p className="font-medium">{formData.veteranAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch of Service</p>
              <p className="font-medium">{getServiceBranchLabel(formData.serviceBranch)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Years of Service</p>
              <p className="font-medium">{formData.serviceYears}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rank</p>
              <p className="font-medium">{formData.rank}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">War/Conflict Era</p>
              <p className="font-medium">{getWarEraLabel(formData.warEra)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{formData.isDeceased ? 'Deceased Veteran' : 'Living Veteran'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Berkeley Heights Resident While Serving</p>
              <p className="font-medium">{formData.berkeleyHeightsResident ? 'Yes' : 'No'}</p>
            </div>
            {formData.additionalInfo && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Additional Information</p>
                <p className="font-medium">{formData.additionalInfo}</p>
              </div>
            )}
          </div>
        </section>
        
        <section>
          <h3 className="text-lg font-semibold text-navy-800 mb-4">Photo</h3>
          <div className="flex justify-center">
            {formData.photoUrl && (
              <div className="border rounded-md overflow-hidden max-w-xs">
                <img src={formData.photoUrl} alt="Veteran" className="max-w-full h-auto" />
              </div>
            )}
          </div>
          {formData.photoAnnotation && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Photo Notes</p>
              <p className="font-medium">{formData.photoAnnotation}</p>
            </div>
          )}
        </section>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Banner Request
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>
          By submitting this form, you certify that all information provided is accurate to the best of your knowledge.
        </p>
      </div>
    </div>
  );
};