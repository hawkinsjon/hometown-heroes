import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { FormDataType, PhotoData, formatName } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { militaryBranches } from './ServiceBranchSelector';
import { Loader2, FileText, GripVertical, Trash2 } from 'lucide-react';
import PDFPreview from '../ui/PDFPreview';
import SignaturePad from '../ui/SignaturePad';

interface ReviewStepProps {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onBack: () => void;
  onNext: () => void;
}

const BANNER_TEMPLATE_URL = "https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/hometown-hero-banner-template-sample-debra-hurd.jpg";

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onUpdate,
  onBack,
  onNext,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  const [photoOrder, setPhotoOrder] = useState(formData?.photos || []);

  const API_URL = '/api/submit-banner';

  const getFileExtension = (filename: string): string => {
    const name = filename || '';
    const lastDot = name.lastIndexOf('.');
    return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
  };
  
  const isDocumentFormat = (photo: PhotoData): boolean => {
    const ext = getFileExtension(photo.filename || '');
    return photo.contentType === 'application/pdf' ||
           photo.contentType === 'application/postscript' || // EPS
           photo.contentType === 'application/eps' ||
           photo.contentType === 'application/illustrator' || // AI
           photo.contentType === 'application/vnd.adobe.illustrator' ||
           photo.contentType === 'image/tiff' || // TIFF
           ext === 'eps' ||
           ext === 'psd' || // Added psd based on original logic, assuming contentType might be generic
           ext === 'ai' ||
           ext === 'tiff' ||
           ext === 'tif';
  };

  const isPDF = (photo: PhotoData): boolean => {
    return photo.contentType === 'application/pdf';
  };
  
  const getDisplayableFileType = (photo: PhotoData): string => {
    const ext = getFileExtension(photo.filename || '');
    if (photo.contentType === 'application/pdf') return 'PDF';
    if (ext === 'eps' || photo.contentType === 'application/postscript' || photo.contentType === 'application/eps') return 'EPS';
    if (ext === 'psd' || photo.contentType === 'image/vnd.adobe.photoshop' || photo.contentType === 'application/x-photoshop') return 'PSD';
    if (ext === 'ai' || photo.contentType === 'application/illustrator' || photo.contentType === 'application/vnd.adobe.illustrator') return 'AI';
    if (ext === 'tiff' || ext === 'tif' || photo.contentType === 'image/tiff') return 'TIFF';
    return ext.toUpperCase(); // Fallback to extension
  };

  const getBranchLabel = (value: string) => {
    if (!value) return "";
    
    const branch = militaryBranches.find(b => b.value === value);
    return branch ? branch.label : value;
  };

  const getPhotoLabel = (index: number): string => {
    const suffix = index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th';
    return `${index + 1}${suffix} Choice`;
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ consentGiven: e.target.checked });
  };

  const canSubmit = !isSubmitting && signatureData;

  console.log('signatureData:', signatureData, 'canSubmit:', canSubmit);

  const base64ToBlob = (base64: string, contentType: string = 'image/png'): Blob => {
    const base64Data = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    } catch (e) {
      console.error('Error decoding base64 string:', e);
      return new Blob([], { type: contentType }); 
    }
  };

  const handleSubmit = async () => {
    console.log('[handleSubmit] About to check canSubmit. isSubmitting:', isSubmitting, 'signatureData exists:', !!signatureData);
    
    const currentCanSubmit = !isSubmitting && !!signatureData;

    if (!currentCanSubmit) {
        console.log('[handleSubmit] Submission blocked. isSubmitting:', isSubmitting, 'signatureData empty?:', !signatureData);
        if (!signatureData) {
            setSubmitError("Please sign the form to complete your submission.");
        } else if (isSubmitting) {
            setSubmitError("Submission is already in progress. Please wait.");
        }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    console.log("[handleSubmit] Proceeding with submission...");

    const data = new FormData();

    data.append('sponsorName', formData.sponsorName);
    data.append('sponsorEmail', formData.sponsorEmail);
    data.append('relationshipToVeteran', formData.relationshipToVeteran);
    data.append('veteranName', formData.veteranName);
    data.append('veteranAddress', formData.veteranAddress);
    data.append('veteranYearsInBH', formData.veteranYearsInBH);
    data.append('veteranBHConnection', formData.veteranBHConnection);
    data.append('serviceBranch', formData.serviceBranch);
    data.append('isReserve', String(formData.isReserve));
    data.append('servicePeriodOrConflict', formData.servicePeriodOrConflict);
    data.append('consentGiven', String(formData.consentGiven));
    if (formData.unknownBranchInfo) {
      data.append('unknownBranchInfo', formData.unknownBranchInfo);
    }
    if (formData.unknownBranchAudio) {
        data.append('unknownBranchAudio', formData.unknownBranchAudio);
    }

    if (formData.photos && formData.photos.length > 0) {
      data.append('photosMetadata', JSON.stringify(formData.photos.map(p => ({
        publicUrl: p.publicUrl,
        filename: p.filename,
        contentType: p.contentType,
      }))));
    }

    if (signatureData) {
      const signatureBlob = base64ToBlob(signatureData, 'image/png');
      data.append('signatureImage', signatureBlob, 'signature.png');
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
      }

      const result = await response.json();
      console.log("Submission successful (backend):", result);
      onUpdate({ submitted: true });
      onNext();

    } catch (error) {
      console.error("Submission error (frontend):", error);
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred during submission.');
    } finally {
      setIsSubmitting(false);
      console.log("[handleSubmit] Submission process ended, isSubmitting set to false.");
    }
  };

  useEffect(() => {
    setPhotoOrder(formData?.photos || []);
  }, [formData?.photos]);

  const handleReorder = (newOrder: typeof photoOrder) => {
    setPhotoOrder(newOrder);
    onUpdate({ photos: newOrder });
  };

  const removePhoto = (id: string) => {
    if (!photoOrder) return;
    const updatedPhotos = photoOrder.filter((p) => p.id !== id);
    setPhotoOrder(updatedPhotos);
    onUpdate({ photos: updatedPhotos });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full h-full overflow-y-auto pb-8 max-w-6xl mx-auto overflow-x-hidden"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Banner Details</h2>
        <p className="text-marine-gold-400 text-base mb-4">
          Please review carefully. The following will be printed on the banner.
        </p>
      </div>

      <div className="bg-white/10 p-6 rounded-lg mb-4">
        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2 mb-3">Applicant Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-white/70">Name</p>
            <p className="text-white">{formData.sponsorName}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Email</p>
            <p className="text-white">{formData.sponsorEmail}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Relationship to Veteran</p>
            <p className="text-white">{formData.relationshipToVeteran}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white/10 p-6 rounded-lg mb-4">
        <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2 mb-3">Veteran Information</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-white/70">Name</p>
            <p className="text-white">{formData.veteranName}</p>
          </div>
                        <div>
                <p className="text-sm text-white/70">Berkeley Heights Address</p>
                <p className="text-white">{formData.veteranAddress}</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Years Lived in Berkeley Heights</p>
                <p className="text-white">{formData.veteranYearsInBH} years</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Connection to Berkeley Heights</p>
                <p className="text-white whitespace-pre-wrap">{formData.veteranBHConnection}</p>
              </div>
              <div>
            <p className="text-sm text-white/70">Branch</p>
            <p className="text-white">{getBranchLabel(formData.serviceBranch)} {formData.isReserve ? '(Reserve)' : ''}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Service Period/Conflict</p>
            <p className="text-white">{formData.servicePeriodOrConflict}</p>
          </div>
        </div>
      </div>
      
      {formData.unknownBranchInfo && (
        <div className="bg-black/30 p-4 rounded-lg mt-4">
          <strong className="text-white/70 text-base block mb-1">Additional Branch Info:</strong>
          <p className="text-white text-lg whitespace-pre-wrap">{formData.unknownBranchInfo}</p>
        </div>
      )}

      {photoOrder && photoOrder.length > 0 && (
        <div className="bg-gray-800/30 p-6 rounded-lg border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Photos</h3>
          <p className="text-white text-sm mb-3">Drag to reorder your files:</p>
          <div className="w-full overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            <Reorder.Group
              axis="y"
              values={photoOrder}
              onReorder={handleReorder}
              className="flex flex-col gap-3 list-none p-0 items-center"
            >
              {photoOrder.map((photo, index) => {
                const imageUrl = photo.publicUrl || photo.previewUrl;
                return (
                  <Reorder.Item
                    key={photo.id}
                    value={photo}
                    className="relative group bg-gray-800/70 rounded-lg overflow-hidden shadow-md cursor-grab w-full"
                    style={{ 
                      maxWidth: "320px",
                      height: "72px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 8px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    {/* Grip handle on the left */}
                    <div className="flex-shrink-0 h-full flex items-center justify-center px-1 mr-1">
                      <GripVertical className="h-5 w-5 text-marine-gold-500/70 group-hover:text-marine-gold-500 transition-colors" />
                    </div>
                    
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-gray-900">
                      {isDocumentFormat(photo) ? (
                        isPDF(photo) && photo.previewUrl ? (
                          <div className="w-full h-full">
                            <PDFPreview url={photo.previewUrl} filename={photo.filename || 'PDF Document'} width={48} height={48} />
                          </div>
                        ) : (
                          <div className="text-center">
                            <FileText className="w-7 h-7 text-white/70" />
                          </div>
                        )
                      ) : (
                        imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={photo.filename || "Photo"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn('ReviewStep: Image failed to load:', imageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileText className="w-7 h-7 text-white/50" />
                        )
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 ml-3 flex flex-col justify-center">
                      <div className="flex items-center">
                        <div className="bg-black/70 text-white text-xs px-2 py-0.5 rounded mb-1 mr-2">
                          {getPhotoLabel(index)}
                        </div>
                      </div>
                      <p className="text-white text-sm font-medium truncate">{photo.filename || 'Photo'}</p>
                      {isDocumentFormat(photo) && (
                        <p className="text-white/70 text-xs">{getDisplayableFileType(photo)}</p>
                      )}
                    </div>
                    
                    {/* Delete button on right */}
                    <div className="flex-shrink-0 ml-2">
                      <button 
                        onClick={() => removePhoto(photo.id)} 
                        className="bg-marine-gold-500 hover:bg-marine-gold-500 text-navy-900 rounded-full shadow-md flex items-center justify-center w-8 h-8"
                        aria-label="Delete photo"
                      >
                        <Trash2 className="h-5 w-5 text-navy-900" strokeWidth={2.5} />
                      </button>
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
        </div>
      )}
      
      <div className="bg-gray-800/30 p-6 rounded-lg border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Terms & Conditions</h3>
        
        <div className="space-y-4 text-white">
          <ul className="list-disc pl-5 space-y-3 text-white/80">
            <li><strong>Residency Verification:</strong> All applications are reviewed to verify the veteran's genuine connection to Berkeley Heights. Applications for veterans who did not live in Berkeley Heights will be rejected.</li>
            <li>I will receive an email once my submission has been approved.</li>
            <li>New banner submissions are sent to the printers 2 weeks before Memorial Day (mid-May) and 2 weeks before Veterans Day (late October). Once the banners arrive, they will be hung on one of the main streets of Berkeley Heights.</li>
            <li>The location of banners cannot be controlled; placement is determined by the Department of Public Works (DPW), who works hard to put them up, take them down, and maintain the banners.</li>
            <li>To locate a specific banner, you will need to drive around Berkeley Heights and look on Springfield Avenue, Plainfield Avenue, Snyder Avenue, and Park Avenue.</li>
            <li>Each veteran can only have one banner; multiple submissions for the same veteran will be rejected.</li>
            <li>Once printed, the town will continue to display the banner each Memorial Day and Veterans Day. The banners are reusable, heavy-duty, and designed for long-term use.</li>
            <li>The banners are paid for by the Berkeley Heights Veterans Affairs Committee and are at no cost to you or the veteran.</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-800/30 p-6 rounded-lg border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Authorization</h3>
        
        <p className="text-white/90 mb-6">
             I, <span className="font-semibold text-white">{formData.sponsorName || "[Your Name]"}</span>, approve and authorize the usage of my or my family member's photograph and name to be used on printed Hometown Hero Banners in Berkeley Heights.
        </p>
        
        <SignaturePad 
          onSignatureCapture={(data) => {
            console.log('SignaturePad onSignatureCapture CALLED.');
            console.log('Raw data received:', data);
            console.log('Type of data received:', typeof data);
            if (data && typeof data === 'string' && data.startsWith('data:image/')) {
              console.log('Setting signatureData with valid data URI string.');
              setSignatureData(data);
            } else if (data && typeof data === 'string') {
              console.warn('Signature data is a string, but not a data URI. Data:', data.slice(0, 100) + (data.length > 100 ? '...' : ''));
              setSignatureData(data); // Still attempt to set it, might be an SVG or other format
            } else {
              console.warn('Signature data is not a valid data URI string or is empty/null. Data:', data);
              setSignatureData(''); // Explicitly set to empty string
            }
          }}
          label="Sign below to agree to the terms and complete your submission"
          name={formData.veteranName ? `For: ${formatName(formData.veteranName)}` : 'For: Applicant'}
          height={150}
        />
      </div>

      {submitError && (
          <p className="text-center text-red-400 font-medium mt-4">Error: {submitError}</p>
      )}

      <div className="flex justify-between items-center pt-6 w-full max-w-lg mx-auto">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!canSubmit || isSubmitting}
          size="lg"
          className="bg-marine-gold-500 hover:bg-marine-gold-400 text-navy-900 min-w-[120px] flex items-center justify-center disabled:opacity-60 font-bold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <span className="block sm:hidden">Submit</span>
              <span className="hidden sm:block">Submit Application</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="text-center text-sm text-marine-gold-400 mt-4 bg-black/40 p-4 rounded-lg">
        After submission, your banner application will be reviewed by the Berkeley Heights Veterans Affairs Committee. We'll notify you via email when approved or if we need additional information.
      </div>

    </motion.div>
  );
};