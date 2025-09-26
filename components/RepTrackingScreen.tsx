import React, { useState, useEffect } from 'react';
import type { Workout } from '../types';
import { BackArrowIcon } from './icons';

interface RepTrackingScreenProps {
  workout: Workout;
  onSaveReps: (reps: number[]) => void;
  onBack: () => void;
  initialReps?: (number | null)[];
}

export const Numpad: React.FC<{
  exerciseName: string;
  initialValue: string;
  onDone: (value: string) => void;
  onClose: () => void;
}> = ({ exerciseName, initialValue, onDone, onClose }) => {
  const [value, setValue] = useState(initialValue);

  const handleInput = (digit: string) => {
    if (value.length < 3) {
      // Prevent leading zero if input is empty, unless it's the only digit
      if (value === '0') {
        setValue(digit);
      } else {
        setValue(value + digit);
      }
    }
  };

  const handleBackspace = () => {
    setValue(v => v.slice(0, -1));
  };

  const handleDone = () => {
    onDone(value);
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-dark p-6 rounded-xl w-80 space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <p className="text-gray-text truncate" title={exerciseName}>{exerciseName}</p>
          <div className="text-5xl font-bold h-16 flex items-center justify-center">{value || <span className="text-gray-light">0</span>}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {buttons.map(num => (
            <button
              key={num}
              onClick={() => handleInput(num)}
              className="h-16 bg-gray-light rounded-full text-2xl font-semibold transition-transform active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-16 bg-gray-light rounded-full text-2xl font-semibold transition-transform active:scale-95 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
            </svg>
          </button>
          <button
            onClick={() => handleInput('0')}
            className="h-16 bg-gray-light rounded-full text-2xl font-semibold transition-transform active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDone}
            className="h-16 bg-accent text-off-white rounded-full text-lg font-bold transition-transform active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};


export const RepTrackingScreen: React.FC<RepTrackingScreenProps> = ({ workout, onSaveReps, onBack, initialReps }) => {
  const exercisesToTrack = workout.exercises;
  const [reps, setReps] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Effect to initialize reps from props
  useEffect(() => {
     const initial = Array(exercisesToTrack.length).fill('');
    if (initialReps) {
      initialReps.forEach((r, i) => {
        if (r !== null && r >= 0) {
          initial[i] = String(r);
        }
      });
    }
    setReps(initial);
  }, [initialReps, exercisesToTrack.length]);

  const handleSave = () => {
    const repsAsNumbers = reps.map(r => parseInt(r, 10)).map(n => isNaN(n) ? 0 : n);
    onSaveReps(repsAsNumbers);
  };

  const handleNumpadDone = (value: string) => {
    if (editingIndex !== null) {
      const newReps = [...reps];
      newReps[editingIndex] = value;
      setReps(newReps);
    }
    setEditingIndex(null);
  };

  const currentExerciseName = editingIndex !== null ? exercisesToTrack[editingIndex].name : '';
  const currentInitialValue = editingIndex !== null ? reps[editingIndex] : '';

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">Log Your Reps</h1>
        <div className="w-6 h-6"></div>
      </header>

      <div className="flex-grow my-8 space-y-3 overflow-y-auto">
        {exercisesToTrack.map((exercise, index) => (
          <button
            key={index}
            onClick={() => setEditingIndex(index)}
            className="w-full flex items-center justify-between bg-gray-dark p-4 rounded-lg text-left transition-colors hover:bg-gray-light"
          >
            <span className="font-medium">{exercise.name}</span>
            <span className="bg-gray-light text-off-white text-center p-2 rounded-md w-24">
              {reps[index] || <span className="text-gray-text">Reps</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={handleSave}
          className="w-full bg-accent text-off-white font-bold py-4 rounded-full text-lg transition-transform active:scale-95"
        >
          Save & Continue
        </button>
      </div>
      
      {editingIndex !== null && (
        <Numpad 
          exerciseName={currentExerciseName}
          initialValue={currentInitialValue}
          onDone={handleNumpadDone}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
};