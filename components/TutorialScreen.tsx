
import React, { useState, useMemo } from 'react';
import type { Exercise } from '../types';
import { BUILT_IN_DATA } from '../constants';
import { BackArrowIcon, PenIcon, BookIcon } from './icons';

interface TutorialScreenProps {
    onSelectExercise: (exercise: Exercise) => void;
    onBack: () => void;
    onCreateNew: () => void;
    onEditExercise: (exercise: Exercise) => void;
    customExercises: Exercise[];
}

const ExerciseCard: React.FC<{ 
    exercise: Exercise; 
    onClick: () => void;
    onEdit: () => void;
}> = ({ exercise, onClick, onEdit }) => (
  <div 
      className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-accent/50 transition-all duration-300 shadow-lg cursor-pointer active:scale-95"
      onClick={onClick}
  >
      <div className="aspect-square w-full bg-gray-800 relative">
          <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-white hover:text-black"
          >
            <PenIcon className="w-4 h-4" />
          </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-tight">{exercise.name}</h3>
      </div>
  </div>
);

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onSelectExercise, onBack, onCreateNew, onEditExercise, customExercises }) => {
    const [activeTab, setActiveTab] = useState<string>('hiit');
    
    const library = useMemo(() => {
        const allExercises = new Map<string, Exercise>();
        const builtInNames = new Set<string>();

        BUILT_IN_DATA.forEach(w => {
            [w.preWarmUp, w.warmUp, ...w.warmUpExercises, ...w.exercises, w.coolDown].forEach((ex: Exercise) => {
                if (ex?.name && !allExercises.has(ex.name)) {
                    allExercises.set(ex.name, ex);
                    builtInNames.add(ex.name);
                }
            });
        });

        const customExercisesMap = new Map<string, Exercise>(customExercises.map(ex => [ex.name, ex] as [string, Exercise]));
        
        customExercisesMap.forEach((ex, name) => {
            allExercises.set(name, ex);
        });

        const getExercise = (name: string) => allExercises.get(name)!;
        
        const PRE_WARMUP_NAMES = ["Standing March", "Jumping Jacks"];
        const CRAWLING_WARMUP_NAMES = ["Pointers", "Hip Circles", "Twist and Reach"];
        const SIDELYING_WARMUP_NAMES = ["Backstroke", "ITB Leg Lifts", "Side-Lying Leg Lifts"];
        const COOL_DOWN_NAMES = ["Hip Rolls", "Spiderman A-Frames", "Spiderman Arm Circles", "Bloomers", "Straddle Reach", "Iso Pigeon Stretch"];
        
        const hiitNames = new Set<string>();
        BUILT_IN_DATA.forEach(w => w.exercises.forEach((e: Exercise) => hiitNames.add(e.name)));

        const finalCustomExercises = Array.from(allExercises.values()).filter(ex => !builtInNames.has(ex.name));

        return {
            pre: PRE_WARMUP_NAMES.map(getExercise).filter(Boolean),
            warmup: [...CRAWLING_WARMUP_NAMES, ...SIDELYING_WARMUP_NAMES].map(getExercise).filter(Boolean),
            hiit: [...hiitNames].map((name) => getExercise(name)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
            cooldown: COOL_DOWN_NAMES.map(getExercise).filter(Boolean),
            custom: finalCustomExercises.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [customExercises]);

    const tabs = [
        { id: 'hiit', label: 'HIIT' },
        { id: 'warmup', label: 'Warmup' },
        { id: 'cooldown', label: 'Cool' },
        { id: 'custom', label: 'Custom' },
    ];
    
    const currentExercises = library[activeTab as keyof typeof library] || [];

    return (
        <div className="min-h-screen flex flex-col bg-black/95">
            <header className="flex items-center p-4 bg-black/50 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                    <BackArrowIcon className="w-6 h-6 text-white" />
                </button>
                <div className="mx-auto flex items-center gap-2">
                    <BookIcon className="w-5 h-5 text-accent" />
                    <h1 className="font-bold text-xl tracking-wider uppercase">Exercise Library</h1>
                </div>
                <div className="w-6 h-6"></div>
            </header>

            <div className="p-4 pb-0 sticky top-[60px] z-10 bg-black/95 pt-2">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                                activeTab === tab.id 
                                ? 'bg-accent text-black shadow-[0_0_15px_rgba(74,222,128,0.4)]' 
                                : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-grow p-4 overflow-y-auto">
                {activeTab === 'custom' && (
                     <button 
                        onClick={onCreateNew} 
                        className="w-full mb-4 bg-gray-900 border border-dashed border-gray-700 hover:border-accent text-gray-400 hover:text-accent font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-accent group-hover:text-black transition-colors">
                             <PenIcon className="w-4 h-4" />
                        </div>
                        Create New Entry
                    </button>
                )}

                {currentExercises.length > 0 ? (
                     <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 pb-24">
                        {currentExercises.map((ex, idx) => (
                            <ExerciseCard 
                                key={`${ex.name}-${idx}`} 
                                exercise={ex} 
                                onClick={() => onSelectExercise(ex)} 
                                onEdit={() => onEditExercise(ex)} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-600">
                        <p className="text-lg font-medium">No exercises found in this category.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
