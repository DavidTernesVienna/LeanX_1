import React, { useState, useMemo } from 'react';
import type { Exercise } from '../types';
import { BUILT_IN_DATA } from '../constants';
import { BackArrowIcon } from './icons';

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

const Accordion: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  isNested?: boolean;
}> = ({ title, isOpen, onToggle, children, className = '', isNested = false }) => {
  const containerClasses = isNested ? 'bg-gray-light/50 p-3 rounded-lg' : 'bg-gray-dark rounded-xl overflow-hidden';
  const headerClasses = isNested ? 'font-semibold' : 'font-bold p-4';
  
  return (
    <div className={`${containerClasses} ${className}`}>
        <button onClick={onToggle} className={`w-full text-left cursor-pointer ${headerClasses}`} aria-expanded={isOpen}>
            {title}
        </button>
        <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className={isNested ? 'mt-2 space-y-2 pl-2' : 'px-4 pb-4 space-y-2'}>
                 {children}
            </div>
        </div>
    </div>
  );
};


export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onSelectExercise, onBack }) => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const library = useMemo(() => {
        const allExercises = new Map<string, Exercise>();
        BUILT_IN_DATA.forEach(w => {
            [w.preWarmUp, w.warmUp, ...w.warmUpExercises, ...w.exercises, w.coolDown].forEach(ex => {
                if (ex?.name && !allExercises.has(ex.name)) {
                    allExercises.set(ex.name, ex);
                }
            });
        });

        const getExercise = (name: string) => allExercises.get(name)!;
        
        const PRE_WARMUP_NAMES = ["Standing March", "Jumping Jacks"];
        const CRAWLING_WARMUP_NAMES = ["Pointers", "Hip Circles", "Twist and Reach"];
        const SIDELYING_WARMUP_NAMES = ["Backstroke", "ITB Leg Lifts", "Side-Lying Leg Lifts"];
        const COOL_DOWN_NAMES = ["Hip Rolls", "Spiderman A-Frames", "Spiderman Arm Circles", "Bloomers", "Straddle Reach", "Iso Pigeon Stretch"];
        
        const hiitNames = new Set<string>();
        BUILT_IN_DATA.forEach(w => w.exercises.forEach(e => hiitNames.add(e.name)));

        return {
            preWarmup: PRE_WARMUP_NAMES.map(getExercise).filter(Boolean),
            crawlingWarmup: CRAWLING_WARMUP_NAMES.map(getExercise).filter(Boolean),
            sideLyingWarmup: SIDELYING_WARMUP_NAMES.map(getExercise).filter(Boolean),
            hiit: Array.from(hiitNames).sort().map(getExercise).filter(Boolean),
            coolDown: COOL_DOWN_NAMES.map(getExercise).filter(Boolean),
        };
    }, []);
    
    return (
        <div className="min-h-screen flex flex-col p-4">
            <header className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-xl mx-auto">Exercise Library</h1>
                <div className="w-6 h-6"></div>
            </header>
            <main className="flex-grow overflow-y-auto space-y-4">
                 <Accordion title="Pre Warm Up" isOpen={!!openSections['pre']} onToggle={() => toggleSection('pre')}>
                    <ul className="space-y-2">
                        {library.preWarmup.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                    </ul>
                 </Accordion>
                 <Accordion title="Warm Up Exercises" isOpen={!!openSections['warmup']} onToggle={() => toggleSection('warmup')}>
                    <div className="space-y-3">
                        <Accordion title="Crawling Warm Ups" isOpen={!!openSections['warmup-crawl']} onToggle={() => toggleSection('warmup-crawl')} isNested>
                            <ul className="space-y-2">
                                {library.crawlingWarmup.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                            </ul>
                        </Accordion>
                        <Accordion title="Side Lying Warm Ups" isOpen={!!openSections['warmup-side']} onToggle={() => toggleSection('warmup-side')} isNested>
                            <ul className="space-y-2">
                                {library.sideLyingWarmup.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                            </ul>
                        </Accordion>
                    </div>
                 </Accordion>
                 <Accordion title="HIIT Exercises" isOpen={!!openSections['hiit']} onToggle={() => toggleSection('hiit')}>
                     <ul className="space-y-2">
                         {library.hiit.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                     </ul>
                 </Accordion>
                 <Accordion title="Cool Down Exercises" isOpen={!!openSections['cooldown']} onToggle={() => toggleSection('cooldown')}>
                    <ul className="space-y-2">
                        {library.coolDown.map(ex => <ExerciseListItem key={ex.name} exercise={ex} onClick={() => onSelectExercise(ex)} />)}
                    </ul>
                 </Accordion>
            </main>
        </div>
    );
};