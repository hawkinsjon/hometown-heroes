import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Mail, AlertCircle } from 'lucide-react';

interface EmailVerificationStepProps {
  onNext: () => void;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({ onNext }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 flex flex-col items-center"
    >
      <Mail className="w-16 h-16 text-blue-500" />
      <h2 className="text-3xl font-bold text-white">
        Check Your Email
      </h2>
      <p className="text-lg text-white/80 max-w-md">
        A confirmation email has been sent. Please check your inbox and click the confirmation link to complete your submission.
      </p>
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 max-w-md">
        <div className="flex items-center mb-2">
          <AlertCircle className="text-yellow-400 w-5 h-5 mr-2" />
          <p className="text-yellow-300 font-semibold">Important</p>
        </div>
        <p className="text-white/80 text-sm text-left">
          Your submission will not be complete until you verify your email by clicking the link in the confirmation email. If you don't see it, please check your spam folder.
        </p>
      </div>
      <button 
        onClick={onNext} 
        className="mt-4 text-white/60 hover:text-white underline text-base font-normal bg-transparent border-none shadow-none p-0"
        style={{ background: 'none', border: 'none' }}
      >
        Next
      </button>
    </motion.div>
  );
}; 