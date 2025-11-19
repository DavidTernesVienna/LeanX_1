import React from 'react';
import type { Exercise } from '../types';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-title"
    >
      <div 
        className="bg-gray-dark p-6 rounded-xl w-[90vw] max-w-md space-y-4 m-4"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 id="exercise-title" className="text-2xl font-bold text-center">{exercise.name}</h2>
        
        <div className="w-full aspect-square bg-gray-light rounded-lg overflow-hidden">
          {exercise.youtubeId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${exercise.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${exercise.youtubeId}`}
              title={exercise.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : exercise.video ? (
              <video 
                  src={exercise.video} 
                  className="w-full h-full object-cover" 
                  controls 
                  autoPlay 
                  loop 
              />
          ) : (
              <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="text-gray-text space-y-2 max-h-40 overflow-y-auto">
          {exercise.description.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95 mt-2"
          aria-label="Close exercise details"
        >
          Close
        </button>
      </div>
    </div>
  );
};