
import React, { useState, useRef } from 'react';
import type { Profile, DifficultyLevel } from '../types';
import { UserIcon, CameraIcon, CheckIcon, StarIcon } from './icons';

interface OnboardingWizardProps {
  onComplete: (profile: Profile) => void;
  onTakePhoto: (currentName: string) => void;
  onFromGallery: () => void;
  tempPicture: string | null;
  initialName: string;
}

const DifficultyStars: React.FC<{ count: number, color: string }> = ({ count, color }) => (
    <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
             <StarIcon key={i} className={`w-5 h-5 ${color}`} />
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onTakePhoto, onFromGallery, tempPicture, initialName }) => {
  // Initialize step based on whether we are returning with a picture
  // Flow: welcome -> name -> photo -> difficulty -> processing
  const [step, setStep] = useState<'welcome' | 'name' | 'photo' | 'difficulty' | 'processing'>(
      tempPicture ? 'photo' : 'welcome'
  );
  const [name, setName] = useState(initialName || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Beginner');
  const [isExitingWelcome, setIsExitingWelcome] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const handleStart = () => {
      setIsExitingWelcome(true);
      setTimeout(() => {
          setStep('name');
          setIsExitingWelcome(false);
      }, 1000);
  };

  const handlePressStart = () => {
      setIsPressed(true);
  };

  const handlePressEnd = () => {
      if (isPressed) {
          setIsPressed(false);
          handleStart();
      }
  };

  const handlePressCancel = () => {
      setIsPressed(false);
  };

  // Name Step
  const handleNameNext = () => {
    if (name.trim()) {
      setStep('photo');
    }
  };

  // Photo Step
  const handlePhotoNext = () => {
      setStep('difficulty');
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
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 bg-black text-center space-y-12 transition-all duration-1000 ease-out ${isExitingWelcome ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
             <div className="space-y-2">
                <h1 className="text-5xl font-black italic tracking-tighter">LEAN<span className="text-accent">X</span></h1>
                <p className="text-gray-500 text-sm uppercase tracking-[0.2em]">Interval Training App</p>
             </div>
             
             <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                  {/* Wave Animations */}
                  <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-accent rounded-full opacity-50 pointer-events-none transition-all duration-1000 ease-out z-0 ${isExitingWelcome ? 'scale-[30] opacity-0' : 'scale-100'}`} />
                  <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full opacity-30 pointer-events-none transition-all duration-700 ease-out z-0 ${isExitingWelcome ? 'scale-[25] opacity-0' : 'scale-100'}`} />

                  <div className="absolute inset-0 border-2 border-dashed border-gray-800 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none"></div>
                  <div className="absolute inset-4 border border-gray-700 rounded-full pointer-events-none"></div>
                  
                  <button 
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressCancel}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    className={`relative z-10 w-40 h-40 rounded-full font-black uppercase tracking-tighter 
                    flex items-center justify-center pointer-events-auto group
                    transition-all duration-150 ease-out
                    bg-gradient-to-b from-green-400 to-green-600
                    text-black
                    ${isPressed 
                        ? 'shadow-[inset_0_6px_10px_rgba(0,0,0,0.4)] translate-y-[10px]' 
                        : 'shadow-[0_10px_0_#14532d,0_15px_20px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.4)] translate-y-0 hover:brightness-110'
                    }`}
                  >
                      <span className={`text-4xl pt-1 transition-transform duration-150 ${isPressed ? 'scale-95 opacity-80' : ''}`}>START</span>
                  </button>
             </div>
        </div>
      );
  }

  // --- STEP 1: NAME ---
  if (step === 'name') {
      return (
          <div className="min-h-screen flex flex-col p-6 bg-black animate-fade-in">
              <header className="py-4 border-b border-gray-800 mb-8">
                  <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Step 1 // Identity</h2>
              </header>

              <main className="flex-grow flex flex-col items-center space-y-8">
                  
                  {/* Access Pass Visualization */}
                  <div className="w-full max-w-sm aspect-[1.58/1] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden p-6 flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">ACCESS PASS</div>
                              <div className="text-2xl font-black text-white italic tracking-tighter">LEAN<span className="text-accent">X</span></div>
                          </div>
                          <div className="w-24 h-24 bg-gray-950 rounded-lg border border-gray-700 overflow-hidden flex items-center justify-center relative shadow-inner opacity-50">
                                <UserIcon className="w-10 h-10 text-gray-600" />
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
                          <div className="flex gap-4 opacity-50">
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
                      <div className="text-center">
                          <label className="text-gray-500 text-sm uppercase tracking-widest font-bold mb-2 block">Enter Your Codename</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="NAME"
                            className="w-full bg-transparent border-b-2 border-gray-800 py-3 text-center text-white font-black text-3xl focus:border-accent focus:outline-none transition-colors placeholder-gray-800 uppercase"
                            autoFocus
                        />
                      </div>
                  </div>
              </main>

              <footer className="py-4">
                  <button
                      onClick={handleNameNext}
                      disabled={!name.trim()}
                      className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                      Next Step
                  </button>
              </footer>
          </div>
      );
  }

  // --- STEP 2: PHOTO ---
  if (step === 'photo') {
      return (
          <div className="min-h-screen flex flex-col p-6 bg-black animate-fade-in">
              <header className="py-4 border-b border-gray-800 mb-8">
                  <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Step 2 // Photo ID</h2>
              </header>

              <main className="flex-grow flex flex-col items-center space-y-8">
                  
                  {/* Access Pass Visualization */}
                  <div className="w-full max-w-sm aspect-[1.58/1] bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden p-6 flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">ACCESS PASS</div>
                              <div className="text-2xl font-black text-white italic tracking-tighter">LEAN<span className="text-accent">X</span></div>
                          </div>
                          <div className={`w-24 h-24 bg-gray-950 rounded-lg border overflow-hidden flex items-center justify-center relative shadow-inner ${tempPicture ? 'border-accent' : 'border-gray-700'}`}>
                                {tempPicture ? (
                                    <img src={tempPicture} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-gray-600" />
                                )}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">User Name</div>
                              <div className="text-xl font-bold text-white font-mono truncate">
                                  {name}
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
                      <p className="text-center text-gray-400 text-sm">Upload a photo for your ID card.</p>
                      <div className="flex justify-center gap-4">
                           <button onClick={() => onTakePhoto(name)} className="flex-1 py-4 bg-gray-900 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 text-xs font-bold uppercase text-gray-300 hover:bg-gray-800 hover:border-accent transition-all active:scale-95 group">
                               <CameraIcon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" /> 
                               Take Photo
                           </button>
                           <button onClick={onFromGallery} className="flex-1 py-4 bg-gray-900 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-2 text-xs font-bold uppercase text-gray-300 hover:bg-gray-800 hover:border-accent transition-all active:scale-95 group">
                               <div className="w-6 h-6 flex items-center justify-center text-xl font-light text-gray-500 group-hover:text-white transition-colors">+</div>
                               Upload
                           </button>
                      </div>
                  </div>
              </main>

              <footer className="py-4">
                  <button
                      onClick={handlePhotoNext}
                      className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                      {tempPicture ? "Next Step" : "Skip Photo"}
                  </button>
              </footer>
          </div>
      );
  }

  // --- STEP 3: DIFFICULTY ---
  if (step === 'difficulty') {
      return (
        <div className="min-h-screen flex flex-col p-6 bg-black animate-fade-in">
             <header className="py-4 border-b border-gray-800 mb-6">
                  <h2 className="text-xs font-bold text-accent uppercase tracking-widest">Step 3 // Fitness Level</h2>
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
