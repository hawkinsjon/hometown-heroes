import React, { useEffect, useRef } from 'react';

interface FormStepLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode; // For Back/Next buttons
}

export const FormStepLayout: React.FC<FormStepLayoutProps> = ({ 
  title, 
  description, 
  children, 
  footerContent 
}) => {
  const layoutRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={layoutRef} 
      className="flex flex-col w-full bg-gray-900/50 text-white"
    >
      {/* Header */}
      <div className="p-4 text-center border-b border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        {description && (
          <p className="text-lg md:text-xl text-white/80 mt-2 max-w-xl mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {children}
      </div>

      {/* Footer - Should remain at the bottom */}
      {footerContent && (
        <div className="p-6 border-t border-white/10 bg-gray-900/70 backdrop-blur-sm shrink-0">
          {footerContent}
        </div>
      )}
    </div>
  );
}; 