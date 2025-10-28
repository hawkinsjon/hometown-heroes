import React from 'react';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { SelectField } from '../ui/SelectField';
import { Checkbox } from '../ui/Checkbox';

type VeteranInfoStepProps = {
  formData: FormDataType;
  updateFormData: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
};

export const VeteranInfoStep: React.FC<VeteranInfoStepProps> = ({ 
  formData, 
  updateFormData, 
  onNext,
  onBack
}) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const serviceBranches = [
    { value: '', label: 'Select Branch' },
    { value: 'army', label: 'Army' },
    { value: 'navy', label: 'Navy' },
    { value: 'air_force', label: 'Air Force' },
    { value: 'marines', label: 'Marine Corps' },
    { value: 'coast_guard', label: 'Coast Guard' },
    { value: 'space_force', label: 'Space Force' },
    { value: 'national_guard', label: 'National Guard' }
  ];

  const warEras = [
    { value: '', label: 'Select War/Conflict (if applicable)' },
    { value: 'wwii', label: 'World War II (1939-1945)' },
    { value: 'korea', label: 'Korean War (1950-1953)' },
    { value: 'vietnam', label: 'Vietnam War (1955-1975)' },
    { value: 'persian_gulf', label: 'Persian Gulf War (1990-1991)' },
    { value: 'afghanistan', label: 'Afghanistan War (2001-2021)' },
    { value: 'iraq', label: 'Iraq War (2003-2011)' },
    { value: 'other', label: 'Other Conflict' },
    { value: 'peacetime', label: 'Peacetime Service' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.veteranName.trim()) {
      newErrors.veteranName = 'Veteran name is required';
    }
    
    if (!formData.serviceBranch) {
      newErrors.serviceBranch = 'Service branch is required';
    }
    
    if (!formData.serviceYears.trim()) {
      newErrors.serviceYears = 'Years of service are required';
    }
    
    if (!formData.rank.trim()) {
      newErrors.rank = 'Rank is required';
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
          Please provide information about the veteran to be honored on the banner.
        </p>
      </div>
      
      <FormField
        label="Veteran's Full Name"
        id="veteranName"
        value={formData.veteranName}
        onChange={(e) => updateFormData({ veteranName: e.target.value })}
        error={errors.veteranName}
        required
      />
      
      <SelectField
        label="Branch of Service"
        id="serviceBranch"
        value={formData.serviceBranch}
        onChange={(e) => updateFormData({ serviceBranch: e.target.value })}
        options={serviceBranches}
        error={errors.serviceBranch}
        required
      />
      
      <FormField
        label="Years of Service"
        id="serviceYears"
        value={formData.serviceYears}
        onChange={(e) => updateFormData({ serviceYears: e.target.value })}
        placeholder="e.g., 1968-1972"
        error={errors.serviceYears}
        required
      />
      
      <FormField
        label="Rank"
        id="rank"
        value={formData.rank}
        onChange={(e) => updateFormData({ rank: e.target.value })}
        error={errors.rank}
        required
      />
      
      <SelectField
        label="War/Conflict Era"
        id="warEra"
        value={formData.warEra}
        onChange={(e) => updateFormData({ warEra: e.target.value })}
        options={warEras}
        error={errors.warEra}
      />
      
      <Checkbox
        label="Veteran is deceased"
        id="isDeceased"
        checked={formData.isDeceased}
        onChange={(e) => updateFormData({ isDeceased: e.target.checked })}
      />
      
      <Checkbox
        label="Veteran was a Berkeley Heights resident while serving"
        id="berkeleyHeightsResident"
        checked={formData.berkeleyHeightsResident}
        onChange={(e) => updateFormData({ berkeleyHeightsResident: e.target.checked })}
      />
      
      <FormField
        label="Additional Information"
        id="additionalInfo"
        as="textarea"
        value={formData.additionalInfo}
        onChange={(e) => updateFormData({ additionalInfo: e.target.value })}
        placeholder="Please provide any additional information that might be relevant (awards, medals, special recognitions, etc.)"
        rows={3}
      />
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
};