import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

type StepperProps = {
  steps: Array<{
    id: number;
    title: string;
  }>;
  currentStep: number;
};

export const FormStepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="py-4 px-6 bg-gray-50 border-b border-gray-200">
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.id < currentStep 
                    ? 'bg-green-100 text-green-600' 
                    : step.id === currentStep 
                    ? 'bg-navy-100 text-navy-600 border-2 border-navy-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </div>
              <span 
                className={`ml-2 text-sm font-medium ${
                  step.id === currentStep 
                    ? 'text-navy-900' 
                    : step.id < currentStep 
                    ? 'text-green-600' 
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 ${
                  step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden">
        <p className="text-sm font-medium text-gray-500">
          Step {currentStep} of {steps.length}: <span className="text-navy-900">{steps[currentStep - 1]?.title}</span>
        </p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-navy-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};