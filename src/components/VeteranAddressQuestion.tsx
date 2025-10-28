import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../hooks/useFormState';
import { Button } from './ui/Button';

type VeteranAddressQuestionProps = {
  formData: FormDataType;
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
};

export const VeteranAddressQuestion: React.FC<VeteranAddressQuestionProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack
}) => {
  const [error, setError] = useState<string | null>(null);
  const [streetAddress, setStreetAddress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Extract street address from full address if it exists
  useEffect(() => {
    if (formData.veteranAddress) {
      // Try to extract just the street part (everything before Berkeley Heights)
      const addressParts = formData.veteranAddress.split(',');
      if (addressParts.length > 0) {
        setStreetAddress(addressParts[0].trim());
      }
    }
  }, [formData.veteranAddress]);

  const validateBerkeleyHeightsAddress = (address: string): boolean => {
    if (!address) return false;
    
    const normalizedAddress = address.toLowerCase().trim();
    
    // Check for Berkeley Heights variations
    const berkeleyHeightsVariations = [
      'berkeley heights',
      'berkeley hts',
      'berkeley heights, nj',
      'berkeley hts, nj',
      'berkeley heights nj',
      'berkeley hts nj'
    ];
    
    return berkeleyHeightsVariations.some(variation => 
      normalizedAddress.includes(variation)
    );
  };

  const handleStreetAddressChange = (value: string) => {
    setStreetAddress(value);
    // Combine street address with Berkeley Heights info
    const fullAddress = value.trim() ? `${value.trim()}, Berkeley Heights, NJ 07922` : '';
    onUpdate('veteranAddress', fullAddress);
    
    if (value.trim()) {
      setError(null);
    }
  };

  const canProceed = streetAddress.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streetAddress.trim()) {
      setError("Please enter the veteran's street address");
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
          Address Where Veteran Resided
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto mb-4">
          Enter the street address where this veteran lived in Berkeley Heights
        </p>
      </div>

      <form onSubmit={handleSubmit} id="veteran-address-form" className="max-w-lg mx-auto space-y-6">
        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-white/90 mb-1">
            Street Address *
          </label>
          <input
            id="streetAddress"
            ref={inputRef}
            type="text"
            value={streetAddress}
            onChange={(e) => handleStreetAddressChange(e.target.value)}
            required
            placeholder="e.g., 29 Park Avenue"
            className="w-full px-4 py-3 text-lg bg-black/20 text-white border-2 border-white/20 rounded-lg focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all duration-200 placeholder-white/50 backdrop-blur-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-white/90 mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              value="Berkeley Heights"
              readOnly
              className="w-full px-4 py-3 text-lg bg-gray-700/50 text-white/70 border-2 border-white/10 rounded-lg cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-white/90 mb-1">
              State
            </label>
            <input
              id="state"
              type="text"
              value="NJ"
              readOnly
              className="w-full px-4 py-3 text-lg bg-gray-700/50 text-white/70 border-2 border-white/10 rounded-lg cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-white/90 mb-1">
            Zip Code
          </label>
          <input
            id="zipCode"
            type="text"
            value="07922"
            readOnly
            className="w-full px-4 py-3 text-lg bg-gray-700/50 text-white/70 border-2 border-white/10 rounded-lg cursor-not-allowed"
          />
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