import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../hooks/useFormState';
import { Button } from './ui/Button';

type VeteranNameQuestionProps = {
  formData: FormDataType;
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
};

export const VeteranNameQuestion: React.FC<VeteranNameQuestionProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const canProceed = formData.veteranName?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.veteranName?.trim()) {
      setError("Please enter the veteran's name");
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
          Veteran's Name
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">
          Enter the full name of the veteran to be honored
        </p>
      </div>

      <form onSubmit={handleSubmit} id="veteran-name-form" className="max-w-lg mx-auto space-y-6">
        <div>
          <label htmlFor="veteranName" className="block text-sm font-medium text-white/90 mb-1">
            Full Name
          </label>
          <input
            id="veteranName"
            ref={inputRef}
            type="text"
            value={formData.veteranName || ''}
            onChange={(e) => {
              onUpdate('veteranName', e.target.value);
              if (e.target.value.trim()) setError(null);
            }}
            required
            placeholder="e.g., John A. Smith"
            className="w-full px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 placeholder-white/50 backdrop-blur-sm"
          />
          
          {error && (
            <p className="text-red-400 text-sm mt-1">{error}</p>
          )}
          
          <p className="text-sm text-white/60 mt-2">
            Please enter the veteran's name as it should appear on the banner
          </p>
        </div>
        
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