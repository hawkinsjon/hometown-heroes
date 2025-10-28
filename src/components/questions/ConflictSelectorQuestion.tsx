import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FormDataType } from '../../hooks/useFormState';
import { Button } from '../ui/Button';

type ServiceInfoQuestionProps = {
  formData: FormDataType;
  onUpdate: (updates: Partial<FormDataType>) => void;
  onNext: () => void;
  onBack: () => void;
  setModalState?: (isOpen: boolean) => void;
};

// Define the structure for conflict data
interface Conflict {
  value: string;
  label: string;
  startYear: number;
  endYear?: number;
  years?: string;
  description?: string;
  ribbonUrl: string;
}

// Comprehensive list of conflicts with ribbon images
const conflicts: Conflict[] = [
  // Custom option (will be placed at top in component)
  {
    value: "other",
    label: "Custom Service Period",
    startYear: 0, // Special case for sorting
    description: "Enter specific years of service or an unlisted conflict.",
    ribbonUrl: ""
  },
  // Modern Conflicts
  {
    value: "iraq_syria",
    label: "Operation Inherent Resolve",
    startYear: 2014,
    years: "2014–present",
    description: "Iraq and Syria: Campaign against ISIS.",
    ribbonUrl: "/ribbons/Inherent_Resolve_Campaign_Medal_ribbon.svg.png"
  },
  {
    value: "iraq",
    label: "Operation Iraqi Freedom",
    startYear: 2003, 
    endYear: 2011,
    years: "2003–2011",
    description: "Iraq War.",
    ribbonUrl: "/ribbons/Iraq_Campaign_Medal_ribbon.svg.webp"
  },
  {
    value: "afghanistan",
    label: "Operation Enduring Freedom",
    startYear: 2001,
    endYear: 2021,
    years: "2001–2021",
    description: "War in Afghanistan.",
    ribbonUrl: "/ribbons/Afghanistan_Campaign_Medal_ribbon.svg.webp"
  },
  {
    value: "kosovo",
    label: "Operation Joint Guardian",
    startYear: 1998,
    endYear: 1999,
    years: "1998–1999",
    description: "Kosovo: NATO peacekeeping mission.",
    ribbonUrl: "/ribbons/Kosovo_Campaign_Medal_ribbon.svg.png"
  },
  {
    value: "bosnia",
    label: "Operation Joint Endeavor",
    startYear: 1995,
    endYear: 1996,
    years: "1995–1996",
    description: "Bosnia: NATO peacekeeping mission.",
    ribbonUrl: "/ribbons/Armed_Forces_Expeditionary_Medal_ribbon.svg.webp"
  },
  {
    value: "somalia",
    label: "Operation Restore Hope",
    startYear: 1992,
    endYear: 1994,
    years: "1992–1994",
    description: "Somalia: Humanitarian mission.",
    ribbonUrl: "/ribbons/Armed_Forces_Expeditionary_Medal_ribbon.svg.webp"
  },
  {
    value: "gulf_war",
    label: "Operations Desert Shield & Storm",
    startYear: 1990,
    endYear: 1991,
    years: "1990–1991",
    description: "Persian Gulf War (liberation of Kuwait).",
    ribbonUrl: "/ribbons/Kuwait_Liberation_Medal_ribbon.svg.png"
  },
  {
    value: "panama",
    label: "Operation Just Cause",
    startYear: 1989,
    endYear: 1990,
    years: "1989–1990",
    description: "Panama: Restoring democracy.",
    ribbonUrl: "/ribbons/Armed_Forces_Expeditionary_Medal_ribbon.svg.webp"
  },
  {
    value: "grenada",
    label: "Operation Urgent Fury",
    startYear: 1983,
    endYear: 1983,
    years: "1983",
    description: "Grenada: Restoring order.",
    ribbonUrl: "/ribbons/Armed_Forces_Expeditionary_Medal_ribbon.svg.webp"
  },
  {
    value: "lebanon",
    label: "Multinational Force Deployment",
    startYear: 1982,
    endYear: 1984,
    years: "1982–1984",
    description: "Lebanon: Peacekeeping mission.",
    ribbonUrl: "/ribbons/MFO_Ribbon_bar.svg.png"
  },
  {
    value: "vietnam",
    label: "Vietnam War",
    startYear: 1964,
    endYear: 1975,
    years: "1964–1975",
    description: "Southeast Asia.",
    ribbonUrl: "/ribbons/Vietnam_Service_Medal_ribbon.svg.webp"
  },
  {
    value: "korea",
    label: "Korean War",
    startYear: 1950,
    endYear: 1953,
    years: "1950–1953",
    description: "Korean Peninsula.",
    ribbonUrl: "/ribbons/Korean_Service_Medal_ribbon.svg.webp"
  },
  {
    value: "wwii",
    label: "World War II",
    startYear: 1941,
    endYear: 1945,
    years: "1941–1945",
    description: "Europe and Pacific theaters.",
    ribbonUrl: "/ribbons/World_War_II_Victory_Medal_ribbon.svg.webp"
  },
  {
    value: "wwi",
    label: "World War I",
    startYear: 1917,
    endYear: 1918,
    years: "1917–1918",
    description: "Western Front (Europe).",
    ribbonUrl: "/ribbons/World_War_I_Victory_Medal_ribbon.svg.webp"
  }
];

// Function to generate year options
const generateYearOptions = (startYear: number, endYear: number) => {
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};

const currentYear = new Date().getFullYear();
const yearOptions = generateYearOptions(1900, currentYear);

const ConflictSelectorQuestion: React.FC<ServiceInfoQuestionProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
  setModalState
}) => {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStartYear, setCustomStartYear] = useState<string>("");
  const [customEndYear, setCustomEndYear] = useState<string>("");
  const [isStillServing, setIsStillServing] = useState(false);

  // Sort conflicts by start date (most recent first), but keep "Custom" at the top
  const sortedConflicts = useMemo(() => {
    const customOption = conflicts.find(conflict => conflict.value === "other");
    const otherConflicts = conflicts.filter(conflict => conflict.value !== "other")
      .sort((a, b) => b.startYear - a.startYear);
    
    return customOption ? [customOption, ...otherConflicts] : otherConflicts;
  }, []);

  const handleSelect = (conflictValue: string, conflictLabel: string) => {
    if (conflictValue === 'other') {
      setIsCustomModalOpen(true);
      if (setModalState) {
        setModalState(true);
      }
      return;
    }
    
    onUpdate({ 
      servicePeriodOrConflict: conflictLabel
    });
    onNext();
  };

  const handleCustomSubmit = () => {
    let serviceDescription = "";
    
    // Check if validation passes
    if (!validateForm()) {
      return;
    }
    
    // Format based on still serving status and available dates
    if (isStillServing) {
      serviceDescription = `${customStartYear}–Present`;
    } else if (customStartYear && customEndYear) {
      serviceDescription = `${customStartYear}–${customEndYear}`;
    } else if (customStartYear) {
      serviceDescription = customStartYear;
    } else {
      serviceDescription = "Unknown";
    }
    
    onUpdate({ 
      servicePeriodOrConflict: serviceDescription
    });
    
    // Close modal and proceed
    setIsCustomModalOpen(false);
    if (setModalState) {
      setModalState(false);
    }
    onNext();
  };

  // Form validation
  const validateForm = () => {
    // Start year must be provided
    if (!customStartYear) {
      alert("Please enter a start year.");
      return false;
    }
    
    // If not still serving, end year must be provided
    if (!isStillServing && !customEndYear) {
      alert("Please enter an end year or select 'Still serving'.");
      return false;
    }
    
    // Validate year range
    if (!isStillServing && customStartYear && customEndYear && parseInt(customStartYear) > parseInt(customEndYear)) {
      alert("Start year cannot be after end year.");
      return false;
    }
    
    return true;
  };

  const getFirstName = (fullName: string | undefined): string => {
    if (!fullName?.trim()) return 'the veteran'; // Default if name is empty or whitespace
    return fullName.split(' ')[0];
  };
  
  const handleYearSelect = (type: 'start' | 'end', year: string) => {
    if (type === 'start') {
      setCustomStartYear(year);
    } else {
      setCustomEndYear(year);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full h-full overflow-y-auto pb-8"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Service Information
        </h2>
        <p className="text-xl text-white/80">
          Select when {getFirstName(formData.veteranName)} served.
        </p>
      </div>

      <div className="space-y-3 max-w-3xl mx-auto px-4">
        {sortedConflicts.map((conflict) => (
          <motion.button
            key={conflict.value}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleSelect(conflict.value, conflict.label)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm ${
              formData.servicePeriodOrConflict === conflict.label
                ? 'border-marine-gold-500 bg-marine-blue-800/50'
                : 'border-white/10 hover:border-white/30 bg-marine-blue-900/30'
            }`}
          >
            <div className="flex items-center gap-5">
              {conflict.ribbonUrl ? (
                <img 
                  src={conflict.ribbonUrl} 
                  alt={`${conflict.label} ribbon`}
                  className="w-24 h-10 object-contain"
                />
              ) : (
                <div className="w-24 h-10 flex items-center justify-center text-white/40 text-xs border border-dashed border-white/20 rounded">
                  <span>{conflict.value === 'other' ? 'Custom' : 'No Ribbon'}</span>
                </div>
              )}
              <div className="flex-grow">
                <h4 className="font-medium text-white text-lg">
                  {conflict.label}
                </h4>
                {conflict.years && (
                  <p className="text-sm text-marine-gold-400">
                    ({conflict.years})
                  </p>
                )}
                {conflict.description && (
                  <p className="text-sm text-white/70 mt-1">{conflict.description}</p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
        </div>

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

      {/* Custom Service Period Modal - Redesigned for better UX */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-marine-blue-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-xl my-8">
            <h3 className="text-2xl font-bold text-white mb-3">
              Enter Service Years
            </h3>
            
            <div className="flex flex-col space-y-6">
              {/* Year Selector Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Year */}
                <div>
                  <label htmlFor="startYear" className="block text-white/90 text-base font-medium mb-2">
                    Start Year
                  </label>
                  <select
                    id="startYear"
                    value={customStartYear}
                    onChange={(e) => setCustomStartYear(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 text-white text-lg border-2 border-white/20 rounded-lg focus:outline-none focus:border-marine-gold-400 transition-colors appearance-none"
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map((year) => (
                      <option key={`start-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* End Year */}
                <div>
                  <label htmlFor="endYear" className="block text-white/90 text-base font-medium mb-2">
                    End Year {isStillServing && <span className="text-marine-gold-400">(Present)</span>}
                  </label>
                  <select
                    id="endYear"
                    value={customEndYear}
                    onChange={(e) => setCustomEndYear(e.target.value)}
                    disabled={isStillServing}
                    className={`w-full px-4 py-3 bg-black/30 text-white text-lg border-2 ${
                      isStillServing ? "border-marine-gold-400/30 bg-marine-blue-950/50" : "border-white/20"
                    } rounded-lg focus:outline-none focus:border-marine-gold-400 transition-colors appearance-none`}
                  >
                    <option value="">
                      {isStillServing ? "Present" : "Select Year"}
                    </option>
                    {yearOptions
                      .filter(year => !customStartYear || year >= parseInt(customStartYear))
                      .map((year) => (
                        <option key={`end-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              {/* Still Serving Checkbox */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStillServing}
                  onChange={(e) => {
                    setIsStillServing(e.target.checked);
                    if (e.target.checked) {
                      setCustomEndYear("");
                    }
                  }}
                  className="w-5 h-5 accent-marine-gold-400 mr-3"
                />
                <span className="text-white text-base">Still serving</span>
              </label>
            </div>
            
            <div className="mt-8 flex justify-between space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCustomModalOpen(false);
                  if (setModalState) {
                    setModalState(false);
                  }
                }}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
          </Button>
          <Button 
                onClick={handleCustomSubmit}
                className="flex-1"
          >
                Continue
          </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ConflictSelectorQuestion; 