import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
// import { Input } from '../ui/Input'; // Assuming you have a reusable Input component

type SponsorInfoQuestionProps = {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
  // Assuming the first step has no back button
};

export const SponsorInfoQuestion: React.FC<SponsorInfoQuestionProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  
  const relationshipOptions = [
    { value: 'self', label: 'Self (I am the veteran)' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'grandchild', label: 'Grandchild' },
    { value: 'grandparent', label: 'Grandparent' },
    { value: 'other-family', label: 'Other Family Member' },
    { value: 'friend', label: 'Friend' },
    { value: 'neighbor', label: 'Neighbor' },
    { value: 'community-member', label: 'Community Member' },
    { value: 'organization', label: 'Organization/Group' },
    { value: 'other', label: 'Other' }
  ];

  // Basic validation - removed connectionToBerkeleyHeights requirement
  const canProceed = formData.sponsorName?.trim() && 
                    formData.sponsorEmail?.trim() && 
                    formData.relationshipToVeteran?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.relationshipToVeteran) {
      setRelationshipError("Please select your relationship to the veteran");
      return;
    }
    
    if (canProceed) {
      setRelationshipError(null);
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full h-full overflow-y-auto pb-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Applicant Information
        </h2>
        <p className="text-lg text-white/80">
          Please provide your contact details and relationship to the veteran.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="sponsorName" className="block text-sm font-medium text-white/90 mb-1">
            Your Name *
          </label>
          <input
            id="sponsorName"
            type="text"
            value={formData.sponsorName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ sponsorName: e.target.value })}
            required
            placeholder="e.g., Jane Doe"
            className="w-full px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 placeholder-white/50 backdrop-blur-sm"
          />
        </div>
        
        <div>
          <label htmlFor="sponsorEmail" className="block text-sm font-medium text-white/90 mb-1">
            Email Address *
          </label>
          <input
            id="sponsorEmail"
            type="email"
            value={formData.sponsorEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ sponsorEmail: e.target.value })}
            required
            placeholder="e.g., jane@example.com"
            className="w-full px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 placeholder-white/50 backdrop-blur-sm"
          />
        </div>

        <div>
          <label htmlFor="relationshipToVeteran" className="block text-sm font-medium text-white/90 mb-1">
            Relationship to Veteran *
          </label>
          <select
            id="relationshipToVeteran"
            value={formData.relationshipToVeteran || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              onUpdate({ relationshipToVeteran: e.target.value });
              if (e.target.value) setRelationshipError(null);
            }}
            required
            className="w-full px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 appearance-none"
            style={{ height: '56px' }}
          >
            <option value="">Select relationship...</option>
            {relationshipOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {relationshipError && (
          <p className="text-red-400 text-sm font-medium">{relationshipError}</p>
        )}

        <div className="flex justify-between pt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
          
          <Button 
            type="submit"
            disabled={!canProceed}
            className={`${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue
          </Button>
        </div>
      </form>
    </motion.div>
  );
}; 