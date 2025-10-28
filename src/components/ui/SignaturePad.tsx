import React, { useRef, useState, useEffect } from 'react';
import SignaturePadWrapper from 'react-signature-pad-wrapper';
import { Button } from './Button';

interface SignaturePadProps {
  onSignatureCapture: (signatureData: string) => void;
  initialValue?: string;
  width?: number;
  height?: number;
  className?: string;
  label?: string;
  name?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureCapture,
  initialValue = '',
  width = 400,
  height = 200,
  className = '',
  label = 'Sign here',
  name = '',
}) => {
  const sigPadRef = useRef<any>(null);
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setHasSignature(false);
    onSignatureCapture('');
  };

  const handleStrokeEnd = () => {
    console.log('SignaturePad: handleStrokeEnd called via event listener');
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      console.log('SignaturePad: Pad is not empty, capturing dataURL');
      setHasSignature(true);
      onSignatureCapture(sigPadRef.current.toDataURL());
    } else if (sigPadRef.current && sigPadRef.current.isEmpty()) {
      console.log('SignaturePad: Pad is empty after stroke end');
    }
  };

  useEffect(() => {
    if (initialValue && sigPadRef.current) {
      sigPadRef.current.fromDataURL(initialValue);
      setHasSignature(true);
    }
  }, [initialValue]);

  useEffect(() => {
    let signaturePadInstance: any = null;

    const setupListener = () => {
      if (sigPadRef.current) {
        const actualInstance = sigPadRef.current.signaturePad || sigPadRef.current.instance || sigPadRef.current;
        
        if (actualInstance && typeof actualInstance.addEventListener === 'function') {
          console.log('SignaturePad: Attaching endStroke listener to instance:', actualInstance);
          actualInstance.addEventListener('endStroke', handleStrokeEnd);
          signaturePadInstance = actualInstance;
          return true;
        } else {
          console.warn('SignaturePad: Could not find addEventListener on instance. Instance:', actualInstance, 'Ref:', sigPadRef.current);
        }
      }
      return false;
    };

    if (setupListener()) {
      // Listener was set up on first try
    } else {
      let attempts = 0;
      const intervalId = setInterval(() => {
        attempts++;
        if (setupListener() || attempts >= 10) {
          clearInterval(intervalId);
          if (attempts >=10 && !signaturePadInstance){
             console.error("SignaturePad: Failed to attach event listener after multiple attempts.");
          }
        }
      }, 100);
    }

    return () => {
      if (signaturePadInstance && typeof signaturePadInstance.removeEventListener === 'function') {
        console.log('SignaturePad: Removing endStroke listener from instance:', signaturePadInstance);
        signaturePadInstance.removeEventListener('endStroke', handleStrokeEnd);
      }
    };
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-white font-medium">{label}</label>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClear}
          className="text-sm py-1 h-8 border-white/30 text-white"
        >
          Clear
        </Button>
      </div>
      <div className="border-2 border-marine-gold-400 rounded-lg overflow-hidden bg-white/90 relative">
        <SignaturePadWrapper
          ref={sigPadRef}
          options={{
            penColor: '#000',
            backgroundColor: 'rgba(0,0,0,0)',
          }}
          width={width}
          height={height}
          canvasProps={{
            style: { width: '100%', height: `${height}px`, touchAction: 'none' },
            className: 'w-full h-full',
          }}
        />
      </div>
      <div className="flex justify-between text-gray-700 text-sm">
        {name && <div>{name}</div>}
        <div>{currentDate}</div>
      </div>
      {!hasSignature && (
        <p className="text-gray-500 text-sm text-center italic">
          Draw your signature using mouse or touch
        </p>
      )}
    </div>
  );
};

export default SignaturePad; 