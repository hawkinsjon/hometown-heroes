import React from 'react';
import { FormDataType } from '../hooks/useFormState';

interface ServiceInfoQuestionProps {
  formData: Partial<FormDataType>;
  onUpdate: (data: Partial<FormDataType>) => void;
  onBack: () => void; // Add onBack prop
  onNext: () => void; // Add onNext prop for consistency, even if not used directly
}

// Define the structure for conflict data
interface Conflict {
  name: string;
  ribbonUrl: string;
}

// Define the list of conflicts and their ribbon image paths
// Assuming images are placed in public/images/ribbons/
const conflicts: Conflict[] = [
  { name: 'World War I', ribbonUrl: '/images/ribbons/WWI_Victory_Ribbon.svg' },
  { name: 'World War II', ribbonUrl: '/images/ribbons/WWII_Victory_Ribbon.png' }, // Assuming PNG for this one based on earlier search simulation
  { name: 'Korean War', ribbonUrl: '/images/ribbons/Korean_Service_Ribbon.svg' },
  { name: 'Vietnam War', ribbonUrl: '/images/ribbons/Vietnam_Service_Ribbon.svg' },
  { name: 'Persian Gulf War', ribbonUrl: '/images/ribbons/Southwest_Asia_Service_Ribbon.svg' },
  { name: 'Kosovo Campaign', ribbonUrl: '/images/ribbons/Kosovo_Campaign_Ribbon.svg' },
  { name: 'Afghanistan Campaign', ribbonUrl: '/images/ribbons/Afghanistan_Campaign_Ribbon.svg' },
  { name: 'Iraq Campaign', ribbonUrl: '/images/ribbons/Iraq_Campaign_Ribbon.svg' },
  { name: 'Global War on Terrorism', ribbonUrl: '/images/ribbons/GWOT_Expeditionary_Ribbon.svg' },
  { name: 'Other / Service Period', ribbonUrl: '' }, // Option for manual entry or just period
];


const ServiceInfoQuestion: React.FC<ServiceInfoQuestionProps> = ({
  formData,
  onUpdate,
  onBack,
  onNext,
}) => {
  const handleSelect = (conflictName: string) => {
    onUpdate({ servicePeriodOrConflict: conflictName });
    // Automatically proceed to next step upon selection
    onNext();
  };

  // Simple check to see if the selection looks like a ribbon URL
  const isRibbonSelected = (selection: string | undefined): boolean => {
      return conflicts.some(c => c.name === selection && c.ribbonUrl !== '');
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Select Service Period or Conflict
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose the primary conflict or general service period relevant to the banner.
        Selecting 'Other' will let you specify a different period in the review step if needed (feature not yet implemented).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {conflicts.map((conflict) => (
          <button
            key={conflict.name}
            onClick={() => handleSelect(conflict.name)}
            className={`p-3 border rounded-lg text-center transition-colors duration-200 ease-in-out flex flex-col items-center justify-start space-y-2 h-32
              ${formData.servicePeriodOrConflict === conflict.name
                ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
          >
            {conflict.ribbonUrl ? (
               <img
                 src={conflict.ribbonUrl}
                 alt={`${conflict.name} ribbon`}
                 className="h-8 w-auto border border-gray-400 object-contain mb-2" // Increased height slightly
               />
            ) : (
              // Placeholder for 'Other' or entries without ribbons
              <div className="h-8 w-20 border border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-xs mb-2">
                <span>{conflict.name === 'Other / Service Period' ? 'Other' : 'No Ribbon'}</span>
              </div>
            )}
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {conflict.name}
            </span>
          </button>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
        >
          Back
        </button>
        <button
           onClick={onNext}
           disabled={!formData.servicePeriodOrConflict} // Disable if nothing selected
           className={`px-4 py-2 rounded transition-colors ${
             formData.servicePeriodOrConflict
               ? 'bg-blue-600 text-white hover:bg-blue-700'
               : 'bg-gray-300 text-gray-500 cursor-not-allowed'
           }`}
         >
           Next
         </button>
      </div>
    </div>
  );
};

export default ServiceInfoQuestion; 