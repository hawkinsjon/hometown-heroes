import React from 'react';
import { Flag } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-navy-900 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flag className="h-6 w-6 text-red-600" />
          <h1 className="text-xl font-bold">Berkeley Heights Veterans Banner Program</h1>
        </div>
        <a 
          href="https://www.berkeleyheights.gov" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm hover:underline"
        >
          Visit Berkeley Heights Website
        </a>
      </div>
    </header>
  );
};