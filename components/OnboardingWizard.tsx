
import React, { useState, useRef } from 'react';
import type { Profile, DifficultyLevel } from '../types';
import { UserIcon, CameraIcon, CheckIcon, StarIcon } from './icons';

interface OnboardingWizardProps {
  onComplete: (profile: Profile) => void;
  onTakePhoto: () => void;
  onFromGallery: () => void;
  tempPicture: string | null;
}

const DifficultyStars: React.FC<{ count: number, color: string }> = ({ count, color }) => (
    <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
             <StarIcon key={i} className={`w-5 h-5 ${color}`} />
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onTakePhoto, onFromGallery, tempPicture }) => {
  // Initialize step based on whether we are returning with a picture
  const [step, setStep] = useState<'welcome' | 'identity' | 'difficulty' | 'processing'>(
      tempPicture ? 'identity' : 'welcome'
  );
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Beginner');
  
  // Identity Step
  const handleIdentityNext = () => {
    if (name.trim()) {
      setStep('difficulty');
    }
  };

  const handleDifficultySelect = (level: DifficultyLevel) => {
      setDifficulty(level);
  };
  
  const handleFinish = () => {
      setStep('processing');
      setTimeout(() => {
          const newProfile: Profile = {
              name: name.trim(),
              picture: tempPicture || undefined,
              difficulty: difficulty,
              stats: {
                totalXp: 0,
                level: 1,
                currentStreak: 0,
                bestStreak: 0,
                lastWorkoutDate: null,
                workoutsCompleted: 0
              }
          };
          onComplete(newProfile);
      }, 2000);
  };

  const levels: { id: DifficultyLevel, label: string, desc: string, benchmark: string, starCount: number, color: string }[] = [
      { 
          id: 'Beginner', 
          label: 'Beginner', 
          desc: 'New to fitness or returning after a break.', 
          benchmark: 'Training 0-1x / week',
          starCount: 1,
          color: 'text-green-400' 
      },
      { 
          id: 'Intermediate', 
          label: 'Intermediate', 
          desc: 'You exercise regularly and have good form.', 
          benchmark: 'Training 2-3x / week',
          starCount: 2,
          color: 'text-yellow-400' 
      },
      { 
          id: 'Advanced', 
          label: 'Advanced', 
          desc: 'Consistent high-intensity training.', 
          benchmark: 'Training 4-5x / week',
          starCount: 3,
          color: 'text-orange-500' 
      },
      { 
          id: 'Expert', 
          label: 'Expert', 
          desc: 'Performance athlete pushing limits.', 
          benchmark: 'Training 6+x / week',
          starCount: 4,
          color: 'text-red-600' 
      },
  ];

  if (step === 'welcome') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-center space-y-8 animate-fade-in">
             <div className="space-y-2">
                <h1 className="text-5xl font-black italic tracking-tighter">LEAN<span className="text-accent">X</span></h1>
                <p className="text-gray-500 text-sm uppercase tracking-[0.2em]">Interval Training App</p>
             </div>
             
             <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-gray-800 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none"></div>
                  <div className="absolute inset-4 border border-gray-700 rounded-full pointer-events-none"></div>
                  <button 
                    onClick={() => setStep('identity')}
                    className="relative z-10 w-40 h-40 bg-accent text-black rounded-full font-black text-2xl uppercase tracking-widest hover:scale-110 transition-transform shadow-[0_0_40px_rgba(74,222,128,0.4)] flex flex-col items-center justify-center pointer-events-auto"
                  >
                      <span>GET</span>
                      <span>STARTED</span>
                  </button>
             </div>
             
             <p className="text-xs text-gray-600 font-mono max-w-xs mx-auto">
                 Welcome. Let's set up your profile to get started.
             </p>
        </div>
      );
  }

  if (step === 'identity') {
      return (
          <div className="min-h-screen flex flex-col p-6 bg-black animate-fade-in">
              <header className="py-4 border-b border-gray-800 mb-8">
                  <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Step 1 // Identity</h2>
              </header>

              <main className="flex-grow flex flex-col items-center space-y-8">
                  
                  {/* The Access Pass Card Visualization */}
                  <div className="w-full max-w-sm aspect-[1.58/1] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden p-6 flex flex-col justify-between">
                      {/* Card Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">ACCESS PASS</div>
                              <div className="text-2xl font-black text-white italic tracking-tighter">LEAN<span className="text-accent">X</span></div>
                          </div>
                          <div className="w-24 h-24 bg-gray-950 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                                {tempPicture ? (
                                    <img src={tempPicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-gray-600" />
                                )}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">User Name</div>
                              <div className="text-xl font-bold text-white font-mono truncate">
                                  {name || "UNKNOWN"}
                                  <span className="animate-pulse">_</span>
                              </div>
                          </div>
                          <div className="flex gap-4">
                              <div>
                                  <div className="text-[10px] text-gray-500 uppercase font-bold">Level</div>
                                  <div className="text-sm font-bold text-accent">01</div>
                              </div>
                              <div>
                                  <div className="text-[10px] text-gray-500 uppercase font-bold">Status</div>
                                  <div className="text-sm font-bold text-gray-300">PENDING</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="w-full max-w-xs space-y-4">
                      <div className="flex justify-center gap-4">
                           <button onClick={onTakePhoto} className="px-4 py-2 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-2 text-xs font-bold uppercase text-gray-300 hover:bg-gray-800 transition-colors">
                               <CameraIcon className="w-4 h-4" /> Take Photo
                           </button>
                           <button onClick={onFromGallery} className="px-4 py-2 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-2 text-xs font-bold uppercase text-gray-300 hover:bg-gray-800 transition-colors">
                               <span className="text-lg leading-none">+</span> Upload
                           </button>
                      </div>
                      
                      <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter Name"
                          className="w-full bg-transparent border-b border-gray-700 py-2 text-center text-white font-bold text-lg focus:border-accent focus:outline-none transition-colors placeholder-gray-700"
                          autoFocus
                      />
                  </div>
              </main>

              <footer className="py-4">
                  <button
                      onClick={handleIdentityNext}
                      disabled={!name.trim()}
                      className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                      Next Step
                  </button>
              </footer>
          </div>
      );
  }

  if (step === 'difficulty') {
      return (
        <div className="min-h-screen flex flex-col p-6 bg-black animate-fade-in">
             <header className="py-4 border-b border-gray-800 mb-6">
                  <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Step 2 // Fitness Level</h2>
              </header>

              <main className="flex-grow overflow-y-auto space-y-4 pb-4">
                  {levels.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => handleDifficultySelect(lvl.id)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 group relative overflow-hidden ${difficulty === lvl.id ? 'bg-gray-900 border-accent' : 'bg-black border-gray-800 hover:border-gray-600'}`}
                      >
                          <div className="flex items-center justify-between mb-2 relative z-10">
                              <div className="flex items-center gap-3">
                                  <DifficultyStars count={lvl.starCount} color={lvl.color} />
                                  <span className={`font-black text-xl uppercase tracking-tighter ${difficulty === lvl.id ? 'text-white' : 'text-gray-400'}`}>{lvl.label}</span>
                              </div>
                              {difficulty === lvl.id && <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center"><CheckIcon className="w-4 h-4 text-black" /></div>}
                          </div>
                          
                          {/* Benchmark Tag */}
                          <div className="relative z-10 mb-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded bg-gray-800 border border-gray-700 uppercase tracking-wider ${difficulty === lvl.id ? 'text-white border-gray-600' : 'text-gray-500'}`}>
                                  {lvl.benchmark}
                              </span>
                          </div>

                          <p className="text-sm text-gray-500 font-sans relative z-10">{lvl.desc}</p>
                          
                          {difficulty === lvl.id && <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>}
                      </button>
                  ))}
              </main>

              <footer className="py-4 pt-2">
                  <button
                      onClick={handleFinish}
                      className="w-full bg-accent text-black font-black py-4 rounded-xl uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all active:scale-95"
                  >
                      Finish Setup
                  </button>
              </footer>
        </div>
      );
  }

  if (step === 'processing') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-accent rounded-full animate-spin"></div>
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Setting Up</h2>
                <p className="text-xs text-gray-500 font-mono">Preparing your plan...</p>
            </div>
        </div>
      );
  }

  return null;
};
