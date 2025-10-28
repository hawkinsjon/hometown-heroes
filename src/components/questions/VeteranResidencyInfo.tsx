import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';

type VeteranResidencyInfoProps = {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
};

export const VeteranResidencyInfo: React.FC<VeteranResidencyInfoProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const [error, setError] = useState<string | null>(null);
  const yearsRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (yearsRef.current) {
      yearsRef.current.focus();
    }
  }, []);

  const canProceed = formData.veteranYearsInBH?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.veteranYearsInBH?.trim()) {
      setError("Please specify how long the veteran lived in Berkeley Heights");
      return;
    }
    
    // Validate years is a reasonable number
    const years = parseInt(formData.veteranYearsInBH);
    if (isNaN(years) || years < 1 || years > 100) {
      setError("Please enter a valid number of years (1-100)");
      return;
    }
    
    setError(null);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full h-full overflow-y-auto pb-8 px-4 md:px-6"
    >
      <div className="text-center pt-6 md:pt-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Years in Berkeley Heights
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-4">
          How long did this veteran live in our community?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="veteranYearsInBH" className="block text-sm font-medium text-white/90 mb-1">
            How many years did the veteran live in Berkeley Heights? *
          </label>
          <input
            id="veteranYearsInBH"
            ref={yearsRef}
            type="number"
            min="1"
            max="100"
            value={formData.veteranYearsInBH || ''}
            onChange={(e) => {
              onUpdate({ veteranYearsInBH: e.target.value });
              if (e.target.value.trim()) setError(null);
            }}
            required
            placeholder="e.g., 15"
            className="w-32 px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 placeholder-white/50 backdrop-blur-sm"
          />
          <p className="text-sm text-white/60 mt-1">
            Enter your best estimate if exact years are unknown
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-1 font-medium">{error}</p>
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