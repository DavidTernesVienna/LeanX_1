
import React, { useState } from 'react';
import type { Workout } from '../types';
import { BackArrowIcon } from './icons';

interface RepTrackingScreenProps {
  workout: Workout;
  onSaveReps: (reps: number[]) => void;
  onBack: () => void;
}

export const RepTrackingScreen: React.FC<RepTrackingScreenProps> = ({ workout, onSaveReps, onBack }) => {
  const exercisesToTrack = workout.exercises;
  const [reps, setReps] = useState<string[]>(() => Array(exercisesToTrack.length).fill(''));

  const handleRepChange = (index: number, value: string) => {
    const newReps = [...reps];
    newReps[index] = value;
    setReps(newReps);
  };

  const handleSave = () => {
    const repsAsNumbers = reps.map(r => parseInt(r, 10)).map(n => isNaN(n) ? 0 : n);
    onSaveReps(repsAsNumbers);
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">Log Your Reps</h1>
        <div className="w-6 h-6"></div>
      </header>

      <div className="flex-grow my-8 space-y-4 overflow-y-auto">
        {exercisesToTrack.map((exercise, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-dark p-4 rounded-lg">
            <span className="font-medium">{exercise.name}</span>
            <input
              type="number"
              placeholder="Reps"
              value={reps[index]}
              onChange={(e) => handleRepChange(index, e.target.value)}
              className="w-24 bg-gray-light text-off-white text-center p-2 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
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
    </div>
  );
};
