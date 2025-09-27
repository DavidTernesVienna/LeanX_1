
import React, { useState, useMemo } from 'react';
import type { Exercise } from '../types';
import { BUILT_IN_DATA, CRAWLING_WARMUP_NAMES, SIDELYING_WARMUP_NAMES } from '../constants';
import { BackArrowIcon } from './icons';

// This helper is also in constants.ts but it's cleaner to keep this component self-contained.
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
const createExercise = (name: string): Exercise => ({
  name,
  image: `https://picsum.photos/seed/${slugify(name)}/400/400`,
  description: [
    'This is a placeholder description.',
    'Maintain a straight back and engaged core.',
    'Focus on controlled, deliberate movements.',
    'Breathe steadily throughout the exercise.'
  ]
});

// Define exercise lists based on the prompt
const PRE_WARMUP_EXERCISES = ["Standing March", "Jumping Jacks"].map(createExercise);
const CRAWLING_WARMUP_EXERCISES = CRAWLING_WARMUP_NAMES.map(createExercise);
const SIDELYING_WARMUP_EXERCISES = SIDELYING_WARMUP_NAMES.map(createExercise);
const COOL_DOWN_EXERCISES = [
    "Hip Rolls", "Spiderman A-Frames", "Spiderman Arm Circles", "Bloomers", "Straddle Reach", "Iso Pigeon Stretch"
].map(createExercise);


interface TutorialScreenProps {
    onSelectExercise: (exercise: Exercise) => void;
    onBack: () => void;
}

const ExerciseListItem: React.FC<{ exercise: Exercise; onClick: () => void }> = ({ exercise, onClick }) => (
  <li 
    className="bg-gray-dark p-2 rounded-md cursor-pointer hover:bg-gray-light transition-colors"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
  >
    <div className="flex items-center gap-3">
        <img src={exercise.image} alt={exercise.name} className="w-12 h-12 rounded-md object-cover bg-gray-light flex-shrink-0" />
        <span className="font-medium">{exercise.name}</span>
    </div>
  </li>
);

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onSelectExercise, onBack }) => {
    const [view, setView] = useState<'main' | 'nested' | 'all'>('main');
    
    const { hiitExercises, allExercises } = useMemo(() => {
        const allHiitNames = new Set<string>();
        BUILT_IN_DATA.forEach(w => w.exercises.forEach(e => allHiitNames.add(e.name)));
        
        const hiitExercises = Array.from(allHiitNames).sort().map(createExercise);

        const allExerciseNames = new Set<string>();
        [...PRE_WARMUP_EXERCISES, ...CRAWLING_WARMUP_EXERCISES, ...SIDELYING_WARMUP_EXERCISES, ...COOL_DOWN_EXERCISES, ...hiitExercises].forEach(e => {
            allExerciseNames.add(e.name)
        });
        
        const allExercises = Array.from(allExerciseNames).sort().map(createExercise);
        
        return { hiitExercises, allExercises };
    }, []);
    
    const renderContent = () => {
        if (view === 'nested') {
            return (
                <div className="space-y-4">
                     <details className="bg-gray-dark rounded-xl overflow-hidden">
                        <summary className="font-bold list-none cursor-pointer p-4">Pre Warm Up</summary>
                        <ul className="px-4 pb-4 space-y-2">
                            {PRE_WARMUP_EXERCISES.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                        </ul>
                     </details>
                     <details className="bg-gray-dark rounded-xl overflow-hidden">
                        <summary className="font-bold list-none cursor-pointer p-4">Warm Up Exercises</summary>
                        <div className="px-4 pb-4 space-y-3">
                             <details className="bg-gray-light/50 p-3 rounded-lg">
                                 <summary className="font-semibold list-none cursor-pointer">Crawling Warm Ups</summary>
                                 <ul className="mt-2 space-y-2 pl-2">
                                     {CRAWLING_WARMUP_EXERCISES.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                                 </ul>
                             </details>
                              <details className="bg-gray-light/50 p-3 rounded-lg">
                                 <summary className="font-semibold list-none cursor-pointer">Side Lying Warm Ups</summary>
                                 <ul className="mt-2 space-y-2 pl-2">
                                     {SIDELYING_WARMUP_EXERCISES.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                                 </ul>
                             </details>
                        </div>
                     </details>
                     <details className="bg-gray-dark rounded-xl overflow-hidden">
                        <summary className="font-bold list-none cursor-pointer p-4">HIIT Exercises</summary>
                         <ul className="px-4 pb-4 space-y-2">
                             {hiitExercises.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                         </ul>
                     </details>
                     <details className="bg-gray-dark rounded-xl overflow-hidden">
                        <summary className="font-bold list-none cursor-pointer p-4">Cool Down Exercises</summary>
                        <ul className="px-4 pb-4 space-y-2">
                            {COOL_DOWN_EXERCISES.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                        </ul>
                     </details>
                </div>
            );
        }
        
        if (view === 'all') {
            return (
                 <ul className="space-y-2 list-none p-0 m-0">
                     {allExercises.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                 </ul>
            );
        }

        // main view
        return (
            <div className="flex flex-col items-center justify-center space-y-4 h-full">
                 <button 
                    onClick={() => setView('nested')} 
                    className="w-full max-w-xs bg-gray-dark text-off-white font-bold py-4 rounded-full text-lg transition-transform active:scale-95"
                >
                    Nested List
                </button>
                 <button 
                    onClick={() => setView('all')} 
                    className="w-full max-w-xs bg-gray-dark text-off-white font-bold py-4 rounded-full text-lg transition-transform active:scale-95"
                >
                    All Exercises
                </button>
            </div>
        );
    };

    const handleInternalBack = () => {
        if (view === 'main') {
            onBack();
        } else {
            setView('main');
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-4">
            <header className="flex items-center mb-6">
                <button onClick={handleInternalBack} className="p-2 -ml-2">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-xl mx-auto">Exercise Library</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto">
                 {renderContent()}
            </main>
        </div>
    );
};
