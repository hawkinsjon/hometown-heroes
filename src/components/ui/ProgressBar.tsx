import React from 'react';
import { motion } from 'framer-motion';

type ProgressBarProps = {
  progress: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="h-1.5 w-full bg-marine-blue-800">
      <motion.div
        className="h-full bg-marine-gold-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};