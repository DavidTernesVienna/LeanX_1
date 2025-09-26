
import React from 'react';

interface FinishedScreenProps {
  onLogReps: () => void;
  onContinue: () => void;
}

export const FinishedScreen: React.FC<FinishedScreenProps> = ({ onLogReps, onContinue }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <h1 className="text-4xl font-bold mb-4 text-off-white">Workout Complete!</h1>
      <p className="text-gray-text mb-8">Great job. You've finished your workout.</p>
      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={onLogReps}
          className="w-full bg-accent text-off-white font-bold py-4 rounded-full text-lg transition-transform active:scale-95"
        >
          Log Your Reps
        </button>
        <button
          onClick={onContinue}
          className="w-full bg-gray-dark text-off-white font-bold py-4 rounded-full text-lg transition-transform active:scale-95"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
