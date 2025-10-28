import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { FormDataType, formatName } from '../../hooks/useFormState';
import { Button } from '../ui/Button';
import { Info, Mic, StopCircle } from 'lucide-react';

type ServiceBranchSelectorProps = {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
  skipToPhotoUpload?: () => void;
};

type Branch = {
    value: string;
    label: string;
    description?: string;
    years?: string;
    successor?: string;
    logo: string;
  isHistorical?: boolean;
};

// Flatten the branches into a single array with the historical flag
export const militaryBranches: Branch[] = [
      { 
        value: "army", 
        label: "U.S. Army", 
    description: "Founded in 1775, the U.S. Army is the oldest branch of the U.S. military, defending our nation on land",
    logo: "/emblems/sealArmy.png"
      },
      { 
        value: "navy", 
        label: "U.S. Navy", 
    description: "Established in 1775, the U.S. Navy is America's sea service, defending freedom on the oceans",
    logo: "/emblems/sealNavy.png"
      },
      { 
        value: "air_force", 
        label: "U.S. Air Force", 
    description: "Established as a separate service in 1947, the U.S. Air Force defends our nation in the skies and beyond",
    logo: "/emblems/sealAirForce.png"
      },
      { 
        value: "marines", 
        label: "U.S. Marine Corps", 
    description: "Founded in 1775, the U.S. Marine Corps is America's expeditionary force, always ready to respond where needed",
    logo: "/emblems/sealMarineCorps.png"
      },
      { 
        value: "coast_guard", 
        label: "U.S. Coast Guard", 
    description: "Founded in 1790, the U.S. Coast Guard protects our shores, rescues people at sea, and serves in both peace and war",
    logo: "/emblems/sealCoastGuard.png"
      },
      { 
        value: "space_force", 
        label: "U.S. Space Force", 
    description: "Established in 2019, the U.S. Space Force is the newest branch of the U.S. military, protecting American interests in space",
    logo: "/emblems/sealSpaceForce.png"
      },
      { 
    value: "army_air_forces", 
    label: "U.S. Army Air Forces", 
    description: "The Army's aerial warfare branch during World War II. Became the U.S. Air Force at the end of the war in 1947.",
    logo: "/emblems/sealArmyAirForces.svg.png",
    isHistorical: true
  }
];

export const ServiceBranchSelector: React.FC<ServiceBranchSelectorProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
  skipToPhotoUpload
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showUnknownBranchForm, setShowUnknownBranchForm] = useState(false);
  const [veteranInfo, setVeteranInfo] = useState('');

  const getFirstName = (fullName: string | undefined): string => {
    if (!fullName?.trim()) return 'the veteran';
    const formattedName = formatName(fullName);
    return formattedName.split(' ')[0];
  };

  const handleSelect = (value: string) => {
    onUpdate({ serviceBranch: value, isReserve: false });
    onNext();
  };

  const handleUnknownBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      serviceBranch: 'unknown',
      isReserve: false,
      unknownBranchInfo: veteranInfo,
    });
    setShowUnknownBranchForm(false);
    if (skipToPhotoUpload) {
      skipToPhotoUpload();
    } else {
      onNext();
    }
  };

  return (
    <div className="space-y-8 w-full pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          Which branch did {getFirstName(formData.veteranName)} serve in?
        </h2>
        <p className="text-xl text-white/80">
          Select a military branch
        </p>
      </motion.div>

      <div className="space-y-4">
        <div className="grid gap-4">
          {militaryBranches.map((branch) => (
            <motion.button
              key={branch.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(branch.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm ${
                formData.serviceBranch === branch.value
                  ? 'border-marine-gold-500 bg-marine-blue-800/50'
                  : 'border-white/10 hover:border-white/30 bg-marine-blue-900/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-full bg-white/5 p-1 shadow-lg ${branch.value === "army_air_forces" ? "p-3" : "p-1"}`}>
                  <img 
                    src={branch.logo} 
                    alt={`${branch.label} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-white text-lg">
                    {branch.label}
                    {branch.isHistorical && (
                      <span className="text-xs text-white/70 ml-2 px-2 py-1 bg-marine-gold-500/20 rounded-full">
                        Historical
                      </span>
                    )}
                  </h4>
                  {branch.description && (
                    <p className="text-sm text-white/70 mt-1">{branch.description}</p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {/* Unknown branch option */}
        <div className="flex flex-col items-center mt-6">
          <button
            type="button"
            className="text-marine-gold-400 underline text-base hover:text-marine-gold-300 focus:outline-none"
            onClick={() => setShowUnknownBranchForm(true)}
          >
            I don't know which branch
          </button>
        </div>
      </div>

      {/* Unknown branch form modal */}
      <Dialog open={showUnknownBranchForm} onClose={() => setShowUnknownBranchForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-marine-blue-900 border-2 border-white/10 p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-white mb-4">
              Tell us everything you know
            </Dialog.Title>
            <Dialog.Description className="text-white/80 mb-6">
              Share any details you know about your veteran, like name, rank, years, or stories,
            </Dialog.Description>
            <form onSubmit={handleUnknownBranchSubmit} className="space-y-4">
              <textarea
                className="w-full rounded-md border border-white/20 bg-black/30 text-white p-3 min-h-[100px]"
                placeholder="Type here..."
                value={veteranInfo}
                onChange={e => setVeteranInfo(e.target.value)}
                required
              />
              <div className="flex justify-between gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowUnknownBranchForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-marine-gold-500 text-black">
                  Continue
                </Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="flex justify-between pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
      </div>
    </div>
  );
};