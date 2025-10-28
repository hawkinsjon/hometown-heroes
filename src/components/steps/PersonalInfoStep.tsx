import React from 'react';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';

type PersonalInfoStepProps = {
  formData: FormDataType;
  updateFormData: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
};

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ 
  formData, 
  updateFormData, 
  onNext 
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.submitterName.trim()) {
      newErrors.submitterName = 'Name is required';
    }
    
    if (!formData.submitterEmail.trim()) {
      newErrors.submitterEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.submitterEmail)) {
      newErrors.submitterEmail = 'Please enter a valid email address';
    }
    
    if (!formData.submitterPhone.trim()) {
      newErrors.submitterPhone = 'Phone number is required';
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.submitterPhone)) {
      newErrors.submitterPhone = 'Please enter a valid phone number';
    }
    
    if (!formData.submitterRelationship.trim()) {
      newErrors.submitterRelationship = 'Relationship to veteran is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500 mb-6">
        <p className="text-blue-800">
          Please provide your contact information. We'll use this to communicate with you about the banner.
        </p>
      </div>
      
      <FormField
        label="Your Full Name"
        id="submitterName"
        value={formData.submitterName}
        onChange={(e) => updateFormData({ submitterName: e.target.value })}
        error={errors.submitterName}
        required
      />
      
      <FormField
        label="Email Address"
        id="submitterEmail"
        type="email"
        value={formData.submitterEmail}
        onChange={(e) => updateFormData({ submitterEmail: e.target.value })}
        error={errors.submitterEmail}
        required
      />
      
      <FormField
        label="Phone Number"
        id="submitterPhone"
        type="tel"
        value={formData.submitterPhone}
        onChange={(e) => updateFormData({ submitterPhone: e.target.value })}
        error={errors.submitterPhone}
        required
      />
      
      <FormField
        label="Relationship to Veteran"
        id="submitterRelationship"
        value={formData.submitterRelationship}
        onChange={(e) => updateFormData({ submitterRelationship: e.target.value })}
        error={errors.submitterRelationship}
        placeholder="e.g., Son, Daughter, Spouse, Self"
        required
      />
      
      <div className="flex justify-end pt-4">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};