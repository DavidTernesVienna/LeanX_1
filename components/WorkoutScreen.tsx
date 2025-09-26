import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Workout, Exercise, WorkoutPhase, TimerSnapshot, Settings } from '../types';
import * as ProgressService from '../services/progressService';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon } from './icons';
import { Numpad } from './RepTrackingScreen';

const BEEP_SOUND = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUsAAAAAAP//AgAJAQIFAAcCAwAEAQIIAAEABgABAAQAAgABAAAAAAAAAAAA//8EAgQCAwIBAAcHAgQFAggHBQUGCAUEBAUEBgUFBgYFBQUFBAUEBQQFBAUDBAQDBAUDAgQCAwIEAQIEAgMDAwMDAwMBAwIBAgIBAQEBAAAAAAEBAAAAAAEBAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8EAgQCAwIBAAcHAgQFAggHBQUGCAUEBAUEBgUFBgYFBQUFBAUEBQQFBAUDBAQDBAUDAgQCAwIEAQIEAgMDAwMDAwMBAwIBAgIBAQEBAAAAAAEBAAAAAAEBAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
const PHASE_CHANGE_SOUND = new Audio('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcwBAAAAAAABAwIFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');

const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

const Dot: React.FC<{ status: 'done' | 'active' | 'pending' }> = ({ status }) => {
    const baseClasses = "w-2.5 h-2.5 rounded-full transition-colors";
    if (status === 'done') return <div className={`${baseClasses} bg-green-500`}></div>;
    if (status === 'active') return <div className={`${baseClasses} bg-accent`}></div>;
    return <div className={`${baseClasses} bg-gray-light`}></div>;
};

const ProgressIndicator: React.FC<{
    workout: Workout;
    rounds: number;
    phase: WorkoutPhase;
    currentRound: number;
    currentExerciseIndex: number;
}> = ({ workout, rounds, phase, currentRound, currentExerciseIndex }) => {

    const getStatus = (r: number, e: number): 'done' | 'active' | 'pending' => {
        if (phase === 'cooldown' || phase === 'done') return 'done';
        if (phase === 'warmup' || phase === 'getready') return 'pending';
        
        if (r < currentRound) return 'done';
        if (r > currentRound) return 'pending';
        
        // current round
        if (e < currentExerciseIndex) return 'done';
        if (e > currentExerciseIndex) return 'pending';

        // current exercise
        if (phase === 'work') return 'active';
        if (phase === 'rest') return 'done';

        return 'pending';
    };

    const warmupStatus = phase === 'warmup' ? 'active' : (phase !== 'getready' ? 'done' : 'pending');
    const cooldownStatus = phase === 'cooldown' ? 'active' : (phase === 'done' ? 'done' : 'pending');

    return (
        <div className="flex items-center justify-center gap-3 text-xs text-gray-text uppercase font-semibold w-full mb-6">
            <div className="flex flex-col items-center gap-1">
                <span>Warm Up</span>
                <Dot status={warmupStatus} />
            </div>
            <div className="flex-1 h-px bg-gray-light"></div>
            
            <div className="flex flex-col items-center gap-2">
                {Array.from({ length: rounds }).map((_, roundIndex) => (
                    <div key={roundIndex} className="flex justify-center gap-2">
                        {workout.exercises.map((ex, exIndex) => (
                            <Dot key={`${ex.name}-${roundIndex}`} status={getStatus(roundIndex + 1, exIndex)} />
                        ))}
                    </div>
                ))}
            </div>

            <div className="flex-1 h-px bg-gray-light"></div>
            <div className="flex flex-col items-center gap-1">
                <span>Cool Down</span>
                <Dot status={cooldownStatus} />
            </div>
        </div>
    );
};


export const WorkoutScreen: React.FC<{
    workout: Workout;
    settings: Settings;
    sessionReps: (number | null)[];
    setSessionReps: React.Dispatch<React.SetStateAction<(number | null)[]>>;
    onBack: () => void;
    onFinish: () => void;
}> = ({ workout, settings, sessionReps, setSessionReps, onBack, onFinish }) => {
    const { work, rest, rounds } = workout;

    const [phase, setPhase] = useState<WorkoutPhase>('getready');
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [seconds, setSeconds] = useState(5); // Get ready time
    const [running, setRunning] = useState(true);
    
    const [numpadVisible, setNumpadVisible] = useState(false);
    const [numpadExerciseIndex, setNumpadExerciseIndex] = useState<number | null>(null);
    
    const timerStateRef = useRef<TimerSnapshot | null>(null);

    const playSound = useCallback((sound: HTMLAudioElement) => {
        if (settings.audioCues) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error("Error playing sound:", e));
        }
    }, [settings.audioCues]);

    useEffect(() => {
        const progress = ProgressService.loadProgress();
        const pItem = progress[workout.id];
        
        if (pItem?.inProgress && pItem.snap) {
            const snap = pItem.snap;
            console.log("Resuming workout from snapshot:", snap);

            const clampedExIndex = Math.max(0, Math.min(snap.exerciseIndex, workout.exercises.length - 1));
            const clampedRound = Math.max(1, Math.min(snap.round, rounds));

            setPhase(snap.phase);
            setSeconds(snap.seconds);
            setExerciseIndex(clampedExIndex);
            setRound(clampedRound);
            if (snap.sessionReps) {
                setSessionReps(snap.sessionReps);
            }
        }
    }, [workout, rounds, setSessionReps]);

    const currentExercise: Exercise = useMemo(() => {
        if (phase === 'warmup') return workout.warmUp;
        if (phase === 'cooldown') return workout.coolDown;
        if (phase === 'work' || phase === 'rest') return workout.exercises[exerciseIndex];
        return workout.warmUp; // Default for 'getready'
    }, [phase, exerciseIndex, workout]);

    const handlePhaseChange = useCallback((newPhase: WorkoutPhase) => {
        playSound(PHASE_CHANGE_SOUND);
        setPhase(newPhase);
    }, [playSound]);

    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setSeconds(s => {
                if (s > 1) {
                    if (s <= 4 && (phase === 'work' || phase === 'rest')) {
                         playSound(BEEP_SOUND);
                    }
                    return s - 1;
                }
                
                // --- Timer hits 0, transition to next phase ---
                setNumpadVisible(false);
                setNumpadExerciseIndex(null);
                
                if (phase === 'getready') {
                    handlePhaseChange('warmup');
                    return work;
                }
                if (phase === 'warmup') {
                    handlePhaseChange('work');
                    setExerciseIndex(0);
                    setRound(1);
                    return work;
                }
                if (phase === 'work') {
                    if (round === rounds && exerciseIndex === workout.exercises.length - 1) {
                         handlePhaseChange('cooldown');
                         return work;
                    }
                    
                    handlePhaseChange('rest');
                    if (settings.trackReps) {
                        setNumpadExerciseIndex(exerciseIndex);
                        setNumpadVisible(true);
                    }
                    return rest;
                }
                if (phase === 'rest') {
                    const nextExerciseIndex = exerciseIndex + 1;
                    if (nextExerciseIndex < workout.exercises.length) {
                        setExerciseIndex(nextExerciseIndex);
                    } else {
                        setRound(r => r + 1);
                        setExerciseIndex(0);
                    }
                    handlePhaseChange('work');
                    return work;
                }
                if (phase === 'cooldown') {
                    handlePhaseChange('done');
                    onFinish();
                    return 0;
                }
                return 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [running, phase, work, rest, rounds, workout.exercises.length, onFinish, round, exerciseIndex, handlePhaseChange, playSound, settings.trackReps]);
    
    useEffect(() => {
        const snapshot: TimerSnapshot = {
            workoutId: workout.id,
            phase,
            round,
            exerciseIndex,
            seconds,
            sessionReps,
        };
        timerStateRef.current = snapshot;
        
        if (running && phase !== 'done' && phase !== 'getready') {
            ProgressService.markInProgress(workout.id, snapshot);
        }
    }, [workout.id, phase, round, exerciseIndex, seconds, running, sessionReps]);

    useEffect(() => {
        return () => {
            if (timerStateRef.current && timerStateRef.current.phase !== 'done') {
                ProgressService.markInProgress(timerStateRef.current.workoutId, timerStateRef.current);
            }
        };
    }, []);

    const changeExercise = (direction: 1 | -1) => {
        setRunning(false);
        setNumpadVisible(false);
        setNumpadExerciseIndex(null);

        if (phase === 'getready' && direction === 1) {
            setPhase('warmup');
            setSeconds(work);
            return;
        }

        if (phase === 'cooldown' && direction === 1) {
            setPhase('done');
            onFinish();
            return;
        }

        if (phase === 'warmup') {
            if (direction === 1) { 
                setPhase('work');
                setRound(1);
                setExerciseIndex(0);
                setSeconds(work);
            }
        } else if (phase === 'cooldown') {
            if (direction === -1) { 
                setPhase('work');
                setRound(rounds);
                setExerciseIndex(workout.exercises.length - 1);
                setSeconds(work);
            }
        } else if (phase === 'work' || phase === 'rest') {
             let currentExIndex = exerciseIndex;
             let currentR = round;
             
             currentExIndex += direction;

             if (currentExIndex < 0) {
                 currentR--;
                 currentExIndex = workout.exercises.length - 1;
             }
             if (currentExIndex >= workout.exercises.length) {
                 currentR++;
                 currentExIndex = 0;
             }

             if (currentR < 1) {
                setPhase('warmup');
                setSeconds(work);
             } else if (currentR > rounds) {
                setPhase('cooldown');
                setSeconds(work);
             } else {
                setPhase('work');
                setRound(currentR);
                setExerciseIndex(currentExIndex);
                setSeconds(work);
             }
        }
    };
    
    const handleNumpadDone = (value: string) => {
        if (numpadExerciseIndex !== null) {
          const newRepsValue = parseInt(value, 10);
          const finalReps = isNaN(newRepsValue) ? null : newRepsValue;
          setSessionReps(prev => {
            const newReps = [...prev];
            newReps[numpadExerciseIndex] = finalReps;
            return newReps;
          });
        }
        setNumpadVisible(false);
        setNumpadExerciseIndex(null);
    };


    const handleNext = () => changeExercise(1);
    const handlePrev = () => changeExercise(-1);

    const canGoPrev = !(phase === 'getready' || phase === 'warmup');
    const canGoNext = phase !== 'done';

    const getHeaderText = () => {
        switch (phase) {
            case 'getready': return "Get Ready";
            case 'warmup': return "Warm Up";
            case 'cooldown': return "Cool Down";
            case 'rest': return "REST";
            case 'work': return currentExercise.name;
            default: return "";
        }
    };
    
    const getSubHeaderText = () => {
         if (phase === 'work') {
            return `Set ${round} of ${rounds} — Exercise ${exerciseIndex + 1} of ${workout.exercises.length}`;
         }
         return currentExercise.name;
    };


    return (
        <div className="min-h-screen flex flex-col p-4">
            <header className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="p-2 -ml-2">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <p className="font-semibold uppercase">{getHeaderText()}</p>
                    <p className="text-sm text-gray-text">{getSubHeaderText()}</p>
                </div>
                <button className="p-2 -mr-2">
                     <InfoIcon className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-grow flex flex-col items-center justify-center my-6 space-y-4">
                <div className="w-64 h-64 rounded-lg bg-gray-dark flex items-center justify-center">
                   <img src={currentExercise.image} alt={currentExercise.name} className="w-full h-full object-cover rounded-lg"/>
                </div>
                 <div className="w-full max-w-sm px-4">
                    <ul className="text-left text-gray-text list-disc list-inside space-y-1">
                        {currentExercise.description.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                </div>
            </div>

            <div className="mt-auto text-center flex flex-col items-center">
                <ProgressIndicator 
                    workout={workout} 
                    rounds={rounds} 
                    phase={phase} 
                    currentRound={round} 
                    currentExerciseIndex={exerciseIndex} 
                />
                <div className="text-7xl font-mono font-bold mb-6">{formatTime(seconds)}</div>
                <div className="flex items-center justify-center gap-8">
                    <button onClick={handlePrev} disabled={!canGoPrev} className="p-4 text-gray-text rounded-full hover:bg-gray-dark disabled:opacity-30 transition-colors">
                        <PrevIcon className="w-8 h-8" />
                    </button>
                    <button onClick={() => setRunning(!running)} className="w-20 h-20 bg-off-white text-background rounded-full flex items-center justify-center transition-transform active:scale-95">
                        {running ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                    </button>
                    <button onClick={handleNext} disabled={!canGoNext} className="p-4 text-gray-text rounded-full hover:bg-gray-dark disabled:opacity-30 transition-colors">
                        <NextIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>
            
            {numpadVisible && numpadExerciseIndex !== null && (
              <Numpad
                exerciseName={workout.exercises[numpadExerciseIndex].name}
                initialValue={String(sessionReps[numpadExerciseIndex] ?? '')}
                onDone={handleNumpadDone}
                onClose={() => {
                  setNumpadVisible(false);
                  setNumpadExerciseIndex(null);
                }}
              />
            )}
        </div>
    );
};