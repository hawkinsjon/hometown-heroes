import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormState, formatName, FormDataType } from '../hooks/useFormState';
import { WelcomeStep } from './questions/WelcomeStep';
import { SponsorInfoQuestion } from './questions/SponsorInfoQuestion';
import { VeteranNameQuestion } from './VeteranNameQuestion';
import { VeteranAddressQuestion } from './VeteranAddressQuestion';
import { VeteranResidencyInfo } from './questions/VeteranResidencyInfo';
import { ServiceBranchSelector } from './questions/ServiceBranchSelector';
import ConflictSelectorQuestion from './questions/ConflictSelectorQuestion';
import { PhotoUploadQuestion } from './questions/PhotoUploadQuestion';
import { ReviewStep } from './questions/ReviewStep';
import { ConfirmationStep } from './questions/ConfirmationStep';
import { ProgressBar } from './ui/ProgressBar';
import { Footer } from './Footer';

export const BannerSubmissionForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { formData, updateFormData, resetForm } = useFormState();
  const [browserBlockBack, setBrowserBlockBack] = useState(false);
  
  // Initialize the browser history management
  useEffect(() => {
    // Ensure we start with a clean state at step 1
    const initialState = { step: 1 };
    window.history.replaceState(initialState, "", window.location.pathname);
    
    // For future visits
    const unloadHandler = (e: BeforeUnloadEvent) => {
      if (currentStep > 1 && !browserBlockBack) {
        window.history.replaceState({ step: 1 }, "", window.location.pathname);
      }
    };

    window.addEventListener('beforeunload', unloadHandler);
    return () => window.removeEventListener('beforeunload', unloadHandler);
  }, []);
  
  // Handle browser navigation
  useEffect(() => {
    // Function to handle popstate events (browser back/forward)
    const handlePopState = (event: PopStateEvent) => {
      if (browserBlockBack) {
        // If modal is open, don't navigate
        event.preventDefault();
        window.history.pushState(
          { step: currentStep, blockBack: true },
          "",
          window.location.pathname
        );
        return;
      }
      
      const targetStep = event.state?.step || 1;
      
      // Only change step if it's different than current
      if (targetStep !== currentStep) {
        setCurrentStep(targetStep);
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentStep, browserBlockBack]);

  // When current step changes, update browser history
  useEffect(() => {
    if (!browserBlockBack) {
      window.history.pushState(
        { step: currentStep },
        "",
        window.location.pathname
      );
    }
  }, [currentStep, browserBlockBack]);

  // Handler for modal state
  const setModalState = (isOpen: boolean) => {
    setBrowserBlockBack(isOpen);
    
    if (isOpen) {
      // When opening a modal, push a special state to block back
      window.history.pushState(
        { step: currentStep, blockBack: true },
        "",
        window.location.pathname
      );
    } else {
      // When closing a modal, push the current step state
      window.history.pushState(
        { step: currentStep },
        "",
        window.location.pathname
      );
    }
  };
  
  const handleRestart = () => {
    resetForm();
    setCurrentStep(1);
    // Reset browser history to step 1
    window.history.pushState({ step: 1 }, "", window.location.pathname);
  };

  const goToNextStep = (nextStep: number) => {
    setCurrentStep(nextStep);
  };

  const goToPrevStep = (prevStep: number) => {
    setCurrentStep(prevStep);
  };

  // Update to handle both individual field updates and object updates
  const handleFormUpdate = (fieldOrUpdates: string | Partial<FormDataType>, value?: any) => {
    if (typeof fieldOrUpdates === 'string') {
      // Individual field update, with name formatting
      const field = fieldOrUpdates;
      
      // Format the name to ensure proper capitalization
      if (field === 'veteranName' && value) {
        value = formatName(value);
      }
      
      updateFormData({ ...formData, [field]: value });
    } else {
      // Object update
      const updates = fieldOrUpdates;
      
      // Format veteran name if it's included in the updates
      if (updates.veteranName) {
        updates.veteranName = formatName(updates.veteranName);
      }
      
      updateFormData({ ...formData, ...updates });
    }
  };

  const questions = [
    {
      id: 1,
      component: <WelcomeStep 
                  onNext={() => goToNextStep(2)}
                />
    },
    {
      id: 2,
      component: <SponsorInfoQuestion
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={() => goToNextStep(3)}
                  onBack={() => goToPrevStep(1)}
                />
    },
    {
      id: 3,
      component: <VeteranNameQuestion
                  formData={formData}
                  onUpdate={handleFormUpdate}
                  onNext={() => goToNextStep(4)}
                  onBack={() => goToPrevStep(2)}
                />
    },
    {
      id: 4,
      component: <VeteranAddressQuestion
                  formData={formData}
                  onUpdate={handleFormUpdate}
                  onNext={() => goToNextStep(5)}
                  onBack={() => goToPrevStep(3)}
                />
    },
    {
      id: 5,
      component: <VeteranResidencyInfo
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={() => goToNextStep(6)}
                  onBack={() => goToPrevStep(4)}
                />
    },
    {
      id: 6,
      component: <ServiceBranchSelector
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={() => goToNextStep(7)}
                  onBack={() => goToPrevStep(5)}
                  skipToPhotoUpload={() => setCurrentStep(8)}
                />
    },
    {
      id: 7,
      component: <ConflictSelectorQuestion
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={() => goToNextStep(8)}
                  onBack={() => goToPrevStep(6)}
                  setModalState={setModalState}
                />
    },
    {
      id: 8,
      component: <PhotoUploadQuestion
                  formData={formData}
                  onUpdate={handleFormUpdate}
                  onNext={() => goToNextStep(9)}
                  onBack={() => goToPrevStep(7)}
                  setModalState={setModalState}
                />
    },
    {
      id: 9,
      component: <ReviewStep
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={() => goToNextStep(10)}
                  onBack={() => goToPrevStep(8)}
                />
    },
    {
      id: 10,
      component: <ConfirmationStep onRestart={handleRestart} />
    }
  ];

  const currentQuestion = questions.find(q => q.id === currentStep);
  const totalFormSteps = questions.length - 1;
  const progress = currentStep <= 1 ? 0 : ((currentStep - 1) / totalFormSteps) * 100;

  const isWelcomeStep = currentStep === 1;

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <div className="flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl shadow-2xl border border-white/10 flex flex-col">
          {currentStep > 1 && <ProgressBar progress={progress} />}
          <div 
            className={`flex-grow flex ${
              isWelcomeStep ? 'overflow-y-auto' : '' // Conditional overflow
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`w-full ${
                  isWelcomeStep ? '' : 'p-8 md:p-12' // Conditional padding on the motion.div
                }`}
              >
                {currentQuestion?.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};