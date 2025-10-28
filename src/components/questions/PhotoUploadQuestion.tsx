import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { FormDataType, PhotoData, formatName } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { Upload, Image as ImageIcon, FileText, X, AlertCircle, GripVertical, Crop, Camera, Trash2 } from 'lucide-react';
import PDFPreview from '../ui/PDFPreview';
import { Dialog } from '@headlessui/react';
import { v4 as uuidv4 } from 'uuid';

interface PhotoUploadQuestionProps {
  formData: FormDataType;
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  setModalState?: (isOpen: boolean) => void;
}

const API_PRE_SIGN_URL = '/api/upload-image';

const EMBLEM_PATHS: { [key: string]: string } = {
  'army': '/emblems/sealArmy.png',
  'marines': '/emblems/sealMarineCorps.png',
  'navy': '/emblems/sealNavy.png',
  'air-force': '/emblems/sealAirForce.png',
  'coast-guard': '/emblems/sealCoastGuard.png',
  'space-force': '/emblems/sealSpaceForce.png',
  'army-air-forces': '/emblems/sealArmyAirForces.svg.png', // Assuming 'army-air-forces' is a value
  // Add other branches if necessary
};

export const PhotoUploadQuestion: React.FC<PhotoUploadQuestionProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
  setModalState
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);
  const [showBounce, setShowBounce] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Call onBack function when browser back button is clicked
      // This ensures we stay in the application flow
      event.preventDefault();
      onBack();
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onBack]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    if (files.length > 0) setShowBounce(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = async (files: File[]) => {
    setError(null);
    console.log(`[validateAndAddFiles] Processing ${files.length} files:`, files.map(f => f.name));
    
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' ||
      file.type === 'application/postscript' || // EPS
      file.type === 'application/eps' || // Alternative EPS
      file.type === 'image/tiff' || // TIFF
      file.type === 'image/vnd.adobe.photoshop' || // PSD
      file.type === 'application/x-photoshop' || // Alternative PSD
      file.type === 'application/illustrator' || // AI
      file.type === 'application/vnd.adobe.illustrator' || // Alternative AI
      file.name.toLowerCase().endsWith('.eps') || // Fallback for EPS
      file.name.toLowerCase().endsWith('.tiff') || // Fallback for TIFF
      file.name.toLowerCase().endsWith('.tif') || // Alternative TIFF extension
      file.name.toLowerCase().endsWith('.psd') || // Fallback for PSD
      file.name.toLowerCase().endsWith('.ai') // Fallback for AI
    );
    
    console.log(`[validateAndAddFiles] ${validFiles.length} valid files after filtering`);
    
    if (validFiles.length !== files.length) {
      setError('Only image files, PDFs, EPS, TIFF, PSD, and AI files are allowed');
      return;
    }
    
    // Increase size limit to 30MB (30 * 1024 * 1024)
    const oversizedFiles = validFiles.filter(file => file.size > 30 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some files exceed the 30MB size limit');
      return;
    }

    // Add files by uploading them one by one
    setIsProcessing(true);
    const currentPhotos = [...(formData?.photos || [])]; // Create a copy of the current photos array
    const newPhotos = []; // Array to collect all new photos before updating state
    console.log(`[validateAndAddFiles] Starting upload of ${validFiles.length} files. Current photos:`, currentPhotos.length || 0);
    
    for (const file of validFiles) {
      try {
        const newPhotoEntry = await handleFileUploadToSpaces(file);
        if (newPhotoEntry) {
          console.log(`[validateAndAddFiles] Adding new photo with ID ${newPhotoEntry.id}. Current queue count: ${newPhotos.length}, Existing photos count: ${currentPhotos.length}`);
          newPhotos.push(newPhotoEntry); // Add to the new photos array
        }
      } catch (uploadError) {
        console.error("Error during file upload process:", uploadError);
        setError(uploadError instanceof Error ? uploadError.message : 'An error occurred during upload.');
        // Continue with other files instead of breaking
      }
    }
    
    // After all uploads are complete, update the state once with all new photos
    if (newPhotos.length > 0) {
      const allPhotos = [...currentPhotos, ...newPhotos];
      console.log(`[validateAndAddFiles] Finished uploading. Adding ${newPhotos.length} photos to state. Total photos will be: ${allPhotos.length}`);
      onUpdate('photos', allPhotos);
    } else {
      console.log(`[validateAndAddFiles] No new photos were successfully uploaded.`);
    }
    
    setIsProcessing(false);
  };

  const handleFileUploadToSpaces = async (file: File): Promise<PhotoData | null> => {
    console.log(`Starting upload process for: ${file.name}`);
    let temporaryPreviewUrl = URL.createObjectURL(file); // For immediate UI update

    try {
      const preSignResponse = await fetch(API_PRE_SIGN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!preSignResponse.ok) {
        const errorData = await preSignResponse.json().catch(() => ({ message: 'Failed to parse pre-sign error response.' }));
        throw new Error(`Failed to get pre-signed URL: ${preSignResponse.status} ${preSignResponse.statusText}. ${errorData.message || ''}`);
      }

      const { uploadUrl, objectKey, publicUrl } = await preSignResponse.json();
      console.log(`Received pre-signed URL: ${uploadUrl} for key: ${objectKey}, public URL: ${publicUrl}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read', 
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Spaces upload error response:", errorText);
        throw new Error(`Failed to upload to Spaces: ${uploadResponse.status} ${uploadResponse.statusText}. Details: ${errorText.slice(0,200)}`);
      }

      console.log(`Successfully uploaded ${file.name} to Spaces with key ${objectKey}`);
      return {
        id: uuidv4(),
        objectKey: objectKey,
        filename: file.name,
        contentType: file.type,
        previewUrl: temporaryPreviewUrl, // Still keep for initial display before full state update cycle
        publicUrl: publicUrl, // Store the permanent URL
      } as PhotoData;

    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      URL.revokeObjectURL(temporaryPreviewUrl); // Clean up local preview URL on error
      setError(error instanceof Error ? error.message : 'Unknown upload error');
      return null; // Indicate failure for this file
    }
    // We might not need to explicitly revoke temporaryPreviewUrl here if the PhotoData object is short-lived 
    // or if the component displaying it handles revocation when it's no longer needed.
  };

  const removePhoto = (id: string) => {
    if (!formData?.photos) return;
    const updatedPhotos = formData.photos.filter((p) => p.id !== id);
    onUpdate('photos', updatedPhotos);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const reorderPhotos = (newOrder: PhotoData[]) => {
    console.log(`[reorderPhotos] Reordering photos. New order has ${newOrder.length} photos with IDs:`, newOrder.map(p => p.id));
    onUpdate('photos', newOrder);
  };

  // Handle proceeding to the next step
  const handleNext = () => {
    if (isProcessing) return; // Prevent multiple submissions
    if (!(formData?.photos?.length > 0 || hasSkipped)) {
      setShowBounce(true);
      setBounceKey(prev => prev + 1);
      setTimeout(() => setShowBounce(false), 1000); // Reset bounce after 1s
      return;
    }
    try {
      setIsProcessing(true);
      // Ensure photos array is initialized even if empty
      if (!formData?.photos) {
        onUpdate('photos', []);
      }
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        onNext();
      }, 100);
    } catch (err) {
      console.error("Error in photo submission:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Skip photos entirely - MODIFIED TO HANDLE EMBLEM USAGE
  const handleSkip = () => {
    const branch = formData.serviceBranch;
    const emblemPath = branch ? EMBLEM_PATHS[branch] : null;

    if (showSkipModal && emblemPath) { // User clicked "OK" on modal and emblem exists
      const filename = emblemPath.split('/').pop() || `emblem-${branch}.png`;
      const emblemPhotoData: PhotoData = {
        id: `emblem-${branch}-${Date.now()}`,
        filename: filename,
        contentType: 'image/png',
        previewUrl: emblemPath,
        publicUrl: emblemPath, // Emblems are already public
        isEmblem: true,
      };
      onUpdate('photos', [emblemPhotoData]); // Replace existing photos with the emblem
      console.log('Using emblem as photo:', emblemPhotoData);
    } else {
      // Original skip logic: no photos selected, or no emblem found/chosen
      onUpdate('photos', []); 
      console.log('Skipping photos, no emblem selected or found.');
    }
    
    setShowSkipModal(false);
    setHasSkipped(true); 
    setShowBounce(false);
    // Delay onNext slightly to ensure state update propagates if needed
    setTimeout(() => {
        onNext();
    }, 100);
  };

  // Function to get the photo label based on position
  const getPhotoLabel = (index: number): string => {
    const suffix = index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th';
    return `${index + 1}${suffix} Choice`;
  };

  // Modified to use PhotoData properties
  const isPDF = (photo: PhotoData): boolean => {
    return photo.contentType === 'application/pdf';
  };

  // Modified to use PhotoData properties - this was not in the original snippet but good to update if present
  /* 
  const isTIFF = (photo: PhotoData): boolean => {
    return photo.contentType === 'image/tiff' || 
           photo.filename.toLowerCase().endsWith('.tiff') || 
           photo.filename.toLowerCase().endsWith('.tif');
  };
  */

  const getFileExtension = (filename: string): string => {
    const name = filename || '';
    const lastDot = name.lastIndexOf('.');
    return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
  };

  // Modified to use PhotoData properties
  const getFileTypeLabel = (photo: PhotoData): string => {
    const ext = getFileExtension(photo.filename || '');
    
    if (ext === 'eps' || photo.contentType === 'application/postscript' || photo.contentType === 'application/eps') {
      return 'EPS';
    }
    if (ext === 'psd' || photo.contentType === 'image/vnd.adobe.photoshop' || photo.contentType === 'application/x-photoshop') {
      return 'PSD';
      }
    if (ext === 'ai' || photo.contentType === 'application/illustrator' || photo.contentType === 'application/vnd.adobe.illustrator') {
      return 'AI';
    }
    if (ext === 'tiff' || ext === 'tif' || photo.contentType === 'image/tiff') {
      return 'TIFF';
    }
    if (photo.contentType === 'application/pdf') {
      return 'PDF';
    }
    return ''; // For standard image types, show actual preview, no label needed
  };

  // Modified to use PhotoData properties
  const isDocumentFormat = (photo: PhotoData): boolean => {
    const ext = getFileExtension(photo.filename || '');
    return photo.contentType === 'application/pdf' || 
           photo.contentType === 'application/postscript' || 
           photo.contentType === 'application/eps' ||
           photo.contentType === 'application/illustrator' ||
           photo.contentType === 'application/vnd.adobe.illustrator' ||
           photo.contentType === 'image/tiff' ||
           ext === 'eps' ||
           ext === 'ai' ||
           ext === 'tiff' ||
           ext === 'tif';
  };

  // Modified to use photo.previewUrl and handle its optional nature
  const getFileIcon = (photo: PhotoData) => {
    if (isDocumentFormat(photo)) {
      return <FileText className="h-8 w-8 text-white/70" />;
    }
    
    // Prioritize publicUrl if available (for persistent preview)
    // Fallback to previewUrl (blob) for immediate preview during/after upload before publicUrl is used
    const imageUrl = photo.publicUrl || photo.previewUrl;

    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={photo.filename || "Preview"} 
          className="h-full w-full object-cover"
        />
      );
    }
    return <ImageIcon className="h-8 w-8 text-white/70" />; // Fallback icon if no URL at all
  };

  // Effect to revoke previewUrls when component unmounts or photos change
  useEffect(() => {
    const currentPhotoList = formData?.photos || [];
    return () => {
      currentPhotoList.forEach(photo => {
        if (photo.previewUrl && photo.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [formData?.photos]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Hidden file input moved to the top */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/png, image/jpeg, image/webp, application/pdf, application/postscript, application/eps, image/tiff, image/vnd.adobe.photoshop, application/x-photoshop, application/illustrator, application/vnd.adobe.illustrator, .eps, .tiff, .tif, .psd, .ai"
        onChange={handleFileChange}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-8 w-full overflow-hidden"
        style={{ width: "100%", maxWidth: "100%" }}
      >
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Upload Photos</h2>
          <p className="text-xl text-white/80">
            Upload the photo(s) you would like to be used for the banner.
          </p>
        </div>

        {/* Main Upload Area - Centered with max-width */}
        <div className="w-full mx-auto" style={{ maxWidth: "min(100%, 28rem)" }}> {/* Constrained centering container */}
          {/* Upload Options: Only "Upload from device" */}
          {/* REMOVED: Grid container for two options, now just one centered option */}
          {/* Option 1: Upload from device */}
          <div 
            key="upload-device"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => {
              console.log('Upload from device clicked. fileInputRef.current:', fileInputRef.current);
              fileInputRef.current?.click();
            }} 
            className="cursor-pointer p-8 bg-gray-800/50 border-2 border-dashed border-gray-600/80 rounded-xl hover:border-marine-gold-500/90 hover:bg-gray-800/70 transition-all duration-300 ease-in-out text-center shadow-lg flex flex-col items-center justify-center h-64 md:h-72 space-y-4"
          >
            <Upload className="w-16 h-16 text-marine-gold-400/80" />
            <div className="text-white">
              <p className="text-xl font-semibold">Upload Photo</p>
              <p className="text-sm text-white/70">Drop files here or click to browse</p>
              <p className="text-xs text-white/60 mt-2">JPG, PNG, WEBP, PDF, EPS, TIFF, PSD, AI</p>
            </div>
          </div>
          {/* REMOVED: Option 2: Take a photo */}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-marine-red-600/20 border-2 border-marine-red-600/40 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 text-white">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-base">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Photos List with Reordering */}
        {formData?.photos && formData.photos.length > 0 && (
          (() => {
            console.log(`[render] Rendering photos list with ${formData.photos.length} photos. IDs:`, formData.photos.map(p => p.id));
            return (
              <div className="w-full overflow-hidden pb-4">
                <p className="text-white text-base mb-3">Drag to reorder your photos</p>
                <div className="w-full overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900" 
                     style={{ boxSizing: "border-box" }}>
                  <Reorder.Group 
                    axis="y" 
                    values={formData.photos} 
                    onReorder={reorderPhotos}
                    className="flex flex-col gap-3 list-none p-0 items-center"
                  >
                    {(formData?.photos || []).map((photo, index) => {
                      console.log(`[render] Rendering photo ${index} with ID ${photo.id}`);
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
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          {/* Grip handle on the left */}
                          <div className="flex-shrink-0 h-full flex items-center justify-center px-1 mr-1">
                            <GripVertical className="h-5 w-5 text-marine-gold-500/70 group-hover:text-marine-gold-500 transition-colors" />
                          </div>
                          
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-gray-900">
                            {getFileIcon(photo)}
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
                              <p className="text-white/70 text-xs">{getFileTypeLabel(photo)}</p>
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
            );
          })()
        )}
        
        {/* Actions */}
        <div className="flex justify-between w-full max-w-sm mx-auto" style={{ maxWidth: "min(100%, 24rem)" }}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
          <Button 
            type="button" 
            disabled={isProcessing || !(formData?.photos?.length > 0 || hasSkipped)}
            onClick={handleNext}
            className={isProcessing || !(formData?.photos?.length > 0 || hasSkipped) ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isProcessing ? 'Processing...' : 'Continue'}
          </Button>
        </div>
        {formData?.photos?.length === 0 && !hasSkipped && (
          <div className="flex justify-center mt-6">
            <button
              key={`skip-link-${bounceKey}`}
              type="button"
              onClick={() => setShowSkipModal(true)}
              className={`text-marine-gold-400 underline text-base hover:text-marine-gold-300 focus:outline-none text-center${showBounce ? ' animate-bounce' : ''}`}
            >
              I don't have a photo to use
            </button>
          </div>
        )}
        {formData?.photos?.length === 0 && hasSkipped && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              className="text-marine-gold-400 underline text-base hover:text-marine-gold-300 focus:outline-none text-center"
              disabled
            >
              I don't have a photo to use
            </button>
          </div>
        )}
      </motion.div>
      <Dialog open={showSkipModal} onClose={() => setShowSkipModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 border border-white/20">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marine-gold-100">
                <ImageIcon className="h-6 w-6 text-marine-gold-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-white">
                  No photo? No problem!
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    We'll use the emblem of their branch to create a banner with their name and service info.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6">
              <Button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-marine-gold-500 px-3 py-2 text-sm font-semibold text-navy-900 shadow-sm hover:bg-marine-gold-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marine-gold-600"
                onClick={handleSkip} // This now handles the emblem logic when modal is open
              >
                OK
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};