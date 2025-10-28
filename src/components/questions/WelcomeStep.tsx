import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { GraduationCap, Flag, CalendarDays, DollarSign, ChevronRight, Search } from 'lucide-react';
import { BannerLocator } from '../BannerLocator';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const [showLocator, setShowLocator] = useState(false);
  
  // If locator view is active, show it instead of welcome screen
  if (showLocator) {
    return <BannerLocator onBack={() => setShowLocator(false)} />;
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto px-6 sm:px-10 py-8 sm:py-10 space-y-10 sm:space-y-14 lg:space-y-16">
      {/* Top Row: Heading (left) and Banner (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 items-start">
        {/* Left: Heading and subtitle */}
        <div className="text-center md:text-left space-y-4 md:self-center">
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Berkeley Heights
            <span className="block text-marine-gold-400">Hometown Hero</span>
            Banner Program
          </h1>
          <p className="text-white/80 text-base sm:text-lg lg:text-xl max-w-md mx-auto md:max-w-none md:mx-0">
            Honor a veteran by submitting their information for a banner to be displayed in our community.
          </p>
        </div>
        {/* Right: Banner image */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-[16rem] sm:max-w-xs md:max-w-[14rem] lg:max-w-[16rem] rounded-lg shadow-2xl bg-black flex items-center">
            <img
              src="/images/banner-example.png"
              alt="Example of a Hometown Hero banner"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* First Call-to-Action Section */}
      <motion.div 
        className="flex flex-col items-center py-6 sm:py-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-white text-xl sm:text-2xl font-semibold mb-2">
            Apply for a Hometown Hero Banner
          </p>
          <p className="text-white/80 text-base sm:text-lg">
            Takes about 5 minutes to complete
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-marine-red-600 via-marine-gold-400 to-marine-red-600 rounded-xl blur-md opacity-70"></div>
          <Button
            onClick={onNext}
            size="lg"
            className="relative bg-marine-gold-500 hover:bg-marine-gold-400 text-navy-900 font-bold px-12 py-5 text-xl flex items-center gap-2 shadow-xl"
          >
            Start Application <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Second Call-to-Action Section */}
      <motion.div 
        className="flex flex-col items-center py-6 sm:py-8 border-t border-white/10 pt-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-white text-xl sm:text-2xl font-semibold mb-2">
            Locate a specific banner
          </p>
          <p className="text-white/80 text-base sm:text-lg">
            Find where a veteran's banner is displayed
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#c2a861] to-[#c2a861] rounded-xl blur-md opacity-70"></div>
          <Button
            onClick={() => setShowLocator(true)}
            size="lg"
            className="relative bg-[#c2a861] hover:bg-[#d4ba73] text-black font-bold px-12 py-5 text-xl flex items-center gap-2 shadow-xl"
          >
            Find a Banner <Search className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[18rem] mx-auto sm:max-w-none">
        {[{
          icon: <GraduationCap className="h-6 w-6 text-marine-gold-400" />,
          title: "Eligibility",
          text: "Any resident of Berkeley Heights who has served in the U.S. Armed Forces."
        }, {
          icon: <CalendarDays className="h-6 w-6 text-marine-gold-400" />,
          title: "Display Periods",
          text: "Banners go up every Memorial Day and Veterans Day, thanks to the DPW."
        }, {
          icon: <DollarSign className="h-6 w-6 text-marine-gold-400" />,
          title: "No Cost",
          text: "Approved banners are funded by the BH Veterans Affairs Committee."
        }].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white/5 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/10 shadow-md flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-marine-gold-500/20 flex items-center justify-center mb-3">
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed w-full">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 