
import React, { useState, useEffect, useRef } from 'react';
import type { Workout } from '../types';
import { BackArrowIcon, CheckIcon } from './icons';

interface RepTrackingScreenProps {
  workout: Workout;
  onSaveReps: (reps: number[]) => void;
  onBack: () => void;
  initialReps?: number[];
}

// Embedded Numpad Component (Dumb Component)
export const EmbeddedNumpad: React.FC<{
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onNext: () => void;
  isLast?: boolean;
}> = ({ onInput, onBackspace, onNext, isLast }) => {
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-black pb-safe">
      {buttons.map(num => (
        <button
          key={num}
          onClick={() => onInput(num)}
          className="h-14 bg-gray-900 rounded-xl text-2xl font-bold text-white active:bg-gray-800 transition-colors"
        >
          {num}
        </button>
      ))}
      
      <button
        onClick={() => onInput('0')}
        className="h-14 bg-gray-900 rounded-xl text-2xl font-bold text-white active:bg-gray-800 transition-colors"
      >
        0
      </button>
      
      <button
        onClick={onBackspace}
        className="h-14 bg-gray-900 rounded-xl text-xl font-bold text-white flex items-center justify-center active:bg-gray-800 transition-colors"
      >
        ⌫
      </button>

      <button
        onClick={onNext}
        className={`h-14 rounded-xl text-lg font-black uppercase tracking-wider active:scale-95 transition-transform ${isLast ? 'bg-accent text-black' : 'bg-blue-600 text-white'}`}
      >
        {isLast ? 'Done' : 'Next'}
      </button>
    </div>
  );
};

export const Numpad: React.FC<{
  exerciseName: string;
  initialValue: string;
  onDone: (value: string) => void;
  onClose: () => void;
}> = ({ exerciseName, initialValue, onDone, onClose }) => {
  const [value, setValue] = useState(initialValue === '0' || initialValue === '' ? '' : initialValue);

  const handleInput = (digit: string) => {
    if (value.length < 3) {
      setValue(prev => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    onDone(value || '0');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-end z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-3xl border-t border-gray-800 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <div>
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Log Reps</h3>
             <p className="text-white font-bold text-xl truncate max-w-[200px]">{exerciseName}</p>
          </div>
          <div className="h-16 w-24 bg-black rounded-xl border border-gray-700 flex items-center justify-center text-4xl font-bold text-accent font-mono tabular-nums shadow-inner">
             {value || <span className="text-gray-700">0</span>}
          </div>
        </div>
        
        <div className="bg-black p-2">
            <EmbeddedNumpad 
                onInput={handleInput}
                onBackspace={handleBackspace}
                onNext={handleConfirm}
                isLast={true}
            />
        </div>
      </div>
    </div>
  );
};

export const RepTrackingScreen: React.FC<RepTrackingScreenProps> = ({ workout, onSaveReps, onBack, initialReps }) => {
  const exercisesToTrack = workout.exercises;
  const [reps, setReps] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number>(0);
  
  // Ref to scroll selected item into view
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialize reps
  useEffect(() => {
     const initial = Array(exercisesToTrack.length).fill('');
    if (initialReps) {
      initialReps.forEach((r, i) => {
        if (r > 0) {
          initial[i] = String(r);
        }
      });
    }
    setReps(initial);
  }, [initialReps, exercisesToTrack.length]);

  // Scroll active item into view
  useEffect(() => {
      if (itemRefs.current[editingIndex]) {
          itemRefs.current[editingIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [editingIndex]);

  const handleSave = () => {
    const repsAsNumbers = reps.map(r => parseInt(r, 10)).map(n => isNaN(n) ? 0 : n);
    onSaveReps(repsAsNumbers);
  };

  const handleInput = (digit: string) => {
    const currentVal = reps[editingIndex] || '';
    if (currentVal.length < 3) {
      const newVal = (currentVal === '0') ? digit : currentVal + digit;
      const newReps = [...reps];
      newReps[editingIndex] = newVal;
      setReps(newReps);
    }
  };

  const handleBackspace = () => {
    const currentVal = reps[editingIndex] || '';
    const newVal = currentVal.slice(0, -1);
    const newReps = [...reps];
    newReps[editingIndex] = newVal;
    setReps(newReps);
  };

  const handleNext = () => {
      if (editingIndex < exercisesToTrack.length - 1) {
          setEditingIndex(editingIndex + 1);
      } else {
          handleSave();
      }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <header className="flex items-center p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-800">
          <BackArrowIcon className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="font-bold text-lg mx-auto uppercase tracking-wider">Log Reps</h1>
        <button onClick={handleSave} className="text-accent font-bold text-sm uppercase tracking-wider px-2 hover:text-white transition-colors">
            Finish
        </button>
      </header>

      {/* Main Content Area - Exercise List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3" ref={listRef}>
        {exercisesToTrack.map((exercise, index) => {
            const isActive = index === editingIndex;
            const isDone = !!reps[index];
            
            return (
              <button
                key={index}
                ref={(el) => { itemRefs.current[index] = el; }}
                onClick={() => setEditingIndex(index)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 border ${isActive ? 'bg-gray-800 border-accent shadow-lg scale-[1.02]' : 'bg-gray-900 border-gray-800 opacity-70 hover:opacity-100'}`}
              >
                 <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={exercise.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 </div>
                 
                 <div className="flex-grow min-w-0">
                    <h3 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>{exercise.name}</h3>
                    {isDone && !isActive && <p className="text-[10px] text-accent mt-1">Logged: {reps[index]}</p>}
                 </div>

                 <div className={`h-10 min-w-[50px] px-2 rounded-lg flex items-center justify-center font-mono text-lg font-bold ${isActive ? 'bg-accent text-black' : 'bg-black/40 text-gray-500'}`}>
                    {reps[index] || (isActive ? <span className="animate-pulse">|</span> : '-')}
                 </div>
              </button>
            );
        })}
        
        {/* Spacer for scrolling */}
        <div className="h-40"></div>
      </div>

      {/* Bottom Numpad Container */}
      <div className="border-t border-gray-800 bg-black z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Current Exercise</span>
              <span>{editingIndex + 1} / {exercisesToTrack.length}</span>
          </div>
          <EmbeddedNumpad 
            onInput={handleInput}
            onBackspace={handleBackspace}
            onNext={handleNext}
            isLast={editingIndex === exercisesToTrack.length - 1}
          />
      </div>
    </div>
  );
};
