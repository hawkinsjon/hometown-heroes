import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';

type VeteranNameQuestionProps = {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
};

export const VeteranNameQuestion: React.FC<VeteranNameQuestionProps> = ({
  formData,
  onUpdate,
  onNext
}) => {
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.veteranName.trim()) {
      setError("Please enter the veteran's name");
      return;
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <h2 className="text-3xl font-bold text-navy-800">
        Who would you like to honor?
      </h2>
      
      <p className="text-gray-600 max-w-md mx-auto">
        Enter the full name of the veteran as it should appear on their banner
      </p>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div className="relative">
          <input
            type="text"
            value={formData.veteranName}
            onChange={(e) => {
              setError('');
              onUpdate({ veteranName: e.target.value });
            }}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-colors ${
              error 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-navy-500'
            }`}
            placeholder="e.g., John A. Smith"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute text-sm text-red-600 mt-1"
            >
              {error}
            </motion.p>
          )}
        </div>

        <Button 
          type="submit"
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
      </form>
    </motion.div>
  );
};