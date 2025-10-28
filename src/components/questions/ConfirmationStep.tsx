import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { CheckCircle } from 'lucide-react';

interface ConfirmationStepProps {
  // May add props later if needed, e.g., to show submitted data
  onRestart: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onRestart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 flex flex-col items-center"
    >
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h2 className="text-3xl font-bold text-white">
        Application Submitted!
      </h2>
      <p className="text-lg text-white/80 max-w-md">
        Thank you for honoring a Berkeley Heights veteran. Your submission is now complete and has been received.
      </p>
      <Button 
        onClick={onRestart} 
        className="mt-4"
        variant="outline"
      >
        Submit Another Banner
      </Button>
    </motion.div>
  );
}; 