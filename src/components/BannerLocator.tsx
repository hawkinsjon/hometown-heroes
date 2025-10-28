import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

interface Hero {
  last_name: string;
  first_name: string;
  location: string;
  pole: string;
}

export const BannerLocator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [filteredHeroes, setFilteredHeroes] = useState<Hero[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch heroes data from JSON file
    fetch('/data/hometown_heroes.json')
      .then(response => response.json())
      .then(data => {
        setHeroes(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading heroes data:', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHeroes([]);
      return;
    }

    // Perform fuzzy search on heroes
    const results = heroes.filter(hero => {
      const fullName = `${hero.first_name} ${hero.last_name}`.toLowerCase();
      const reverseName = `${hero.last_name} ${hero.first_name}`.toLowerCase();
      const term = searchTerm.toLowerCase();
      
      // Look for matches in first name, last name, or full name in either order
      return fullName.includes(term) || 
             reverseName.includes(term) ||
             hero.first_name.toLowerCase().includes(term) || 
             hero.last_name.toLowerCase().includes(term);
    });

    setFilteredHeroes(results);
  }, [searchTerm, heroes]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <main className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl shadow-2xl border border-white/10 rounded-lg">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <Button 
              onClick={onBack} 
              variant="outline" 
              className="text-white mr-4 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Locate a Hometown Hero Banner</h1>
          </div>
          
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-3 w-full bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-marine-gold-400"
              placeholder="Search by veteran's name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-marine-gold-400 mx-auto"></div>
              <p className="mt-4 text-white">Loading veterans data...</p>
            </div>
          ) : searchTerm.trim() === '' ? (
            <div className="text-center py-10 text-white/70">
              <p>Enter a name above to search for a veteran's banner location</p>
            </div>
          ) : filteredHeroes.length === 0 ? (
            <div className="text-center py-10 text-white/70">
              <p>No matches found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHeroes.map((hero, index) => (
                <motion.div
                  key={`${hero.last_name}-${hero.first_name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {hero.first_name} {hero.last_name}
                      </h2>
                      <div className="mt-2 flex items-center text-marine-gold-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{hero.location}</span>
                      </div>
                    </div>
                    <div className="bg-marine-gold-500/20 px-3 py-1 rounded-md">
                      <span className="text-marine-gold-400 font-medium">Pole: {hero.pole}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}; 