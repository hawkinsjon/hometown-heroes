import React from 'react';
import { BannerSubmissionForm } from './components/BannerSubmissionForm';

function App() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <main className="w-full flex items-center justify-center">
        <BannerSubmissionForm />
      </main>
    </div>
  );
}

export default App;