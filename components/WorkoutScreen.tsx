import React, { useState, useEffect, useMemo } from 'react';
import type { Workout, Exercise } from '../types';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon } from './icons';
import * as ProgressService from '../services/progressService';

const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

type WorkoutPhase = 'getready' | 'warmup' | 'work' | 'rest' | 'cooldown' | 'done';

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
    workoutIndex: number;
    onBack: () => void;
    onFinish: () => void;
}> = ({ workout, workoutIndex, onBack, onFinish }) => {
    const { work, rest, rounds } = ProgressService.parseTiming(workout);

    const [phase, setPhase] = useState<WorkoutPhase>('getready');
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [seconds, setSeconds] = useState(5); // Get ready time
    const [running, setRunning] = useState(true);

    const currentExercise: Exercise = useMemo(() => {
        if (phase === 'warmup') return workout.warmUp;
        if (phase === 'cooldown') return workout.coolDown;
        if (phase === 'work' || phase === 'rest') return workout.exercises[exerciseIndex];
        return workout.warmUp; // Default for 'getready'
    }, [phase, exerciseIndex, workout]);

    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setSeconds(s => {
                if (s > 1) return s - 1;
                
                // Timer hits 0, transition to next phase
                if (phase === 'getready') {
                    setPhase('warmup');
                    return work;
                }
                if (phase === 'warmup') {
                    setPhase('work');
                    setExerciseIndex(0);
                    setRound(1);
                    return work;
                }
                if (phase === 'work') {
                    // Don't rest after the last exercise of the last round
                    if (round === rounds && exerciseIndex === workout.exercises.length - 1) {
                         setPhase('cooldown');
                         return work;
                    }
                    setPhase('rest');
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
                    setPhase('work');
                    return work;
                }
                if (phase === 'cooldown') {
                    setPhase('done');
                    onFinish();
                    return 0;
                }
                return 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [running, phase, work, rest, rounds, workout.exercises.length, onFinish, round, exerciseIndex]);
    
    const changeExercise = (direction: 1 | -1) => {
        setRunning(false);

        // Allow skipping "Get Ready" countdown
        if (phase === 'getready' && direction === 1) {
            setPhase('warmup');
            setSeconds(work);
            return;
        }

        // Allow skipping "Cool Down"
        if (phase === 'cooldown' && direction === 1) {
            setPhase('done');
            onFinish();
            return;
        }

        if (phase === 'warmup') {
            if (direction === 1) { // from warmup to first exercise
                setPhase('work');
                setRound(1);
                setExerciseIndex(0);
                setSeconds(work);
            }
        } else if (phase === 'cooldown') {
            if (direction === -1) { // from cooldown to last exercise
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
        </div>
    );
};