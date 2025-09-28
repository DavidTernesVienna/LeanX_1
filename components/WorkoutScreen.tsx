
/**
 * WorkoutScreen Component Update
 *
 * This component has been updated with an in-workout settings modal and layout adjustments.
 *
 * Key Changes:
 * 1.  Settings Modal: A new settings icon in the header opens a modal where users can
 *     exit, reset the workout, or toggle warm-up, cool-down, sound, and animations on/the-fly.
 * 2.  Dynamic Timer Logic: The core timer logic now respects the new settings, correctly
 *     skipping warm-up or cool-down phases if they are disabled.
 * 3.  Control Alignment: The bottom controls (progress dots and play/pause/skip buttons)
 *     have been vertically aligned for a cleaner, more balanced appearance.
 * 4.  State Management: The component now receives settings and an update handler from
 *     the parent, ensuring that changes made here are reflected globally.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Workout, Exercise, WorkoutPhase, TimerSnapshot, Settings } from '../types';
import * as ProgressService from '../services/progressService';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon, SettingsIcon, RestIcon } from './icons';
import { Numpad } from './RepTrackingScreen';

const BEEP_SOUND = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUsAAAAAAP//AgAJAQIFAAcCAwAEAQIIAAEABgABAAQAAgABAAAAAAAAAAAA//8EAgQCAwIBAAcHAgQFAggHBQUGCAUEBAUEBgUFBgYFBQUFBAUEBQQFBAUDBAQDBAUDAgQCAwIEAQIEAgMDAwMDAwMBAwIBAgIBAQEBAAAAAAEBAAAAAAEBAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8EAgQCAwIBAAcHAgQFAggHBQUGCAUEBAUEBgUFBgYFBQUFBAUEBQQFBAUDBAQDBAUDAgQCAwIEAQIEAgMDAwMDAwMBAwIBAgIBAQEBAAAAAAEBAAAAAAEBAAAAAAEBAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
const PHASE_CHANGE_SOUND = new Audio('data:audio/wav;base64,UklGRkIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcwBAAAAAAABAwIFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==');

const PHASE_COLORS: Record<WorkoutPhase, string> = {
  work: '#16a34a',          // green-600
  rest: '#b45309',          // amber-700
  warmup: '#16a34a',        // green-600 (was blue)
  warmup_rest: '#b45309',   // amber-700
  getready: '#475569',      // slate-600 (for Pre Warm Up)
  getready_work: '#475569', // slate-600
  getready_cooldown: '#475569', // slate-600
  cooldown: '#16a34a',      // green-600 (was lighter green)
  done: '#111827',          // gray-900
};

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  getready: 'Get Ready',
  warmup: 'Warm Up',
  warmup_rest: 'Rest',
  getready_work: 'Get Ready',
  work: 'Work',
  rest: 'Rest',
  getready_cooldown: 'Get Ready',
  cooldown: 'Cool Down',
  done: 'Done',
};

const getPhaseTextColorClass = (phase: WorkoutPhase): string => {
  switch (phase) {
    case 'rest':
    case 'warmup_rest':
      return 'text-rest-yellow';
    case 'getready':
    case 'getready_work':
    case 'getready_cooldown':
      return 'text-slate-400';
    default:
      return 'text-accent';
  }
};

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
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
    warmupStage: number;
    cooldownStage: number;
    settings: Settings;
}> = ({ workout, rounds, phase, currentRound, currentExerciseIndex, warmupStage, cooldownStage, settings }) => {
    
    const getStatus = (r: number, e: number): 'done' | 'active' | 'pending' => {
        if (phase === 'cooldown' || phase === 'done' || phase === 'getready_cooldown') return 'done';
        if (phase.startsWith('warmup') || phase.startsWith('getready')) return 'pending';
        
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

    const getWarmupDotStatus = (dotIndex: number): 'done' | 'active' | 'pending' => {
        if (phase === 'getready') return 'pending';
        if (!phase.startsWith('warmup')) return 'done';

        if (dotIndex < warmupStage) return 'done';
        if (dotIndex === warmupStage) return 'active';
        return 'pending';
    };

    const getCooldownDotStatus = (dotIndex: number): 'done' | 'active' | 'pending' => {
        if (phase === 'done') return 'done';
        if (phase !== 'cooldown' && phase !== 'getready_cooldown') return 'pending';
        
        if (dotIndex < cooldownStage) return 'done';
        if (dotIndex === cooldownStage && phase === 'cooldown') return 'active';
        return 'pending';
    };

    const ProgressArrow = () => (
        <div className="flex items-center justify-center text-gray-text/70">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </div>
    );

    return (
        <div className="flex items-stretch justify-center gap-1 text-xs text-gray-text uppercase font-semibold w-full">
            {settings.enableWarmup && (
                <>
                    <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-lg">
                        <span>Warm Up</span>
                         <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="flex gap-2">
                                <Dot key="warmup-dot-0" status={getWarmupDotStatus(0)} />
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <Dot key={`warmup-dot-${i}`} status={getWarmupDotStatus(i)} />)}
                            </div>
                            <div className="flex gap-2">
                                {[4, 5, 6].map(i => <Dot key={`warmup-dot-${i}`} status={getWarmupDotStatus(i)} />)}
                            </div>
                        </div>
                    </div>
                    <ProgressArrow />
                </>
            )}
            
            <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-lg">
                <span>Work</span>
                <div className="flex flex-col items-center gap-2 mt-1">
                    {Array.from({ length: rounds }).map((_, roundIndex) => (
                        <div key={roundIndex} className="flex justify-center gap-2">
                            {workout.exercises.map((ex, exIndex) => (
                                <Dot key={`${ex.name}-${roundIndex}`} status={getStatus(roundIndex + 1, exIndex)} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {settings.enableCooldown && (
                <>
                    <ProgressArrow />
                    <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-lg">
                        <span>Cool Down</span>
                        <div className="flex justify-center gap-2 mt-1">
                            {[0, 1].map(i => <Dot key={`cooldown-dot-${i}`} status={getCooldownDotStatus(i)} />)}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const ToggleSwitch: React.FC<{
  label: string;
  labelId: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, labelId, checked, onChange }) => (
  <div className="flex justify-between items-center">
    <label id={labelId} className="font-medium text-off-white/90">{label}</label>
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-gray-light'}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const HoldButton: React.FC<{
  onConfirm: () => void;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}> = ({ onConfirm, duration = 2000, children, className }) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current!;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      if (newProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    
    timerRef.current = window.setTimeout(() => {
      onConfirm();
      resetHold();
    }, duration);
  };

  const resetHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    timerRef.current = null;
    animationFrameRef.current = null;
    startTimeRef.current = null;
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={resetHold}
      onMouseLeave={resetHold}
      onTouchStart={(e) => { e.preventDefault(); startHold(); }}
      onTouchEnd={resetHold}
      className={`relative overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div
        className="absolute top-0 left-0 h-full bg-white/20"
        style={{ width: `${progress * 100}%` }}
      ></div>
    </button>
  );
};

const SettingsModal: React.FC<{
    settings: Settings;
    onUpdateSettings: (newSettings: Settings) => void;
    onClose: () => void;
    onExit: () => void;
    onReset: () => void;
    onSaveAndResume: () => void;
}> = ({ settings, onUpdateSettings, onClose, onExit, onReset, onSaveAndResume }) => {

    const handleSettingChange = (key: keyof Settings, value: boolean) => {
        onUpdateSettings({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-dark p-6 rounded-xl w-[90vw] max-w-sm space-y-6 m-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-center">Settings</h2>
                <div className="space-y-4">
                    <ToggleSwitch label="Warm Up" labelId="warmup-toggle" checked={settings.enableWarmup} onChange={() => handleSettingChange('enableWarmup', !settings.enableWarmup)} />
                    <ToggleSwitch label="Cool Down" labelId="cooldown-toggle" checked={settings.enableCooldown} onChange={() => handleSettingChange('enableCooldown', !settings.enableCooldown)} />
                    <ToggleSwitch label="Audio Cues" labelId="audio-toggle" checked={settings.audioCues} onChange={() => handleSettingChange('audioCues', !settings.audioCues)} />
                    <ToggleSwitch label="Motion" labelId="motion-toggle" checked={settings.enableGlassMotion} onChange={() => handleSettingChange('enableGlassMotion', !settings.enableGlassMotion)} />
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-light">
                     <button onClick={onSaveAndResume} className="w-full text-center bg-green-700 hover:bg-green-800 text-off-white font-bold py-3 rounded-full transition-colors">Save & Resume</button>
                    <HoldButton onConfirm={onReset} duration={500} className="w-full text-center bg-yellow-700 hover:bg-yellow-800 text-off-white font-bold py-3 rounded-full transition-colors">Reset Workout</HoldButton>
                    <HoldButton onConfirm={onExit} duration={500} className="w-full text-center bg-red-800 hover:bg-red-900 text-off-white font-bold py-3 rounded-full transition-colors">Exit Workout</HoldButton>
                </div>
            </div>
        </div>
    );
};

export const WorkoutScreen: React.FC<{
    workout: Workout;
    settings: Settings;
    onUpdateSettings: (newSettings: Settings) => void;
    sessionReps: (number | null)[];
    setSessionReps: React.Dispatch<React.SetStateAction<(number | null)[]>>;
    onBack: () => void;
    onFinish: () => void;
    onShowExerciseInfo: (exercise: Exercise) => void;
    onSaveAndExit: () => void;
}> = ({ workout, settings, onUpdateSettings, sessionReps, setSessionReps, onBack, onFinish, onShowExerciseInfo, onSaveAndExit }) => {
    const { work, rest, rounds } = workout;

    const getInitialPhase = useCallback(() => settings.enableWarmup ? 'getready' : 'getready_work', [settings.enableWarmup]);
    const getInitialSeconds = useCallback(() => settings.enableWarmup ? 5 : 10, [settings.enableWarmup]);

    const [phase, setPhase] = useState<WorkoutPhase>(getInitialPhase());
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [seconds, setSeconds] = useState(getInitialSeconds());
    const [running, setRunning] = useState(true);
    const [warmupStage, setWarmupStage] = useState(0);
    const [cooldownStage, setCooldownStage] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const wasRunningOnSettingsOpen = useRef(false);
    
    const [numpadVisible, setNumpadVisible] = useState(false);
    const [numpadExerciseIndex, setNumpadExerciseIndex] = useState<number | null>(null);
    
    const timerStateRef = useRef<TimerSnapshot | null>(null);

    const playSound = useCallback((sound: HTMLAudioElement) => {
        if (settings.audioCues) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error("Error playing sound:", e));
        }
    }, [settings.audioCues]);

     const resetWorkoutState = useCallback(() => {
        const initialPhase = getInitialPhase();
        const initialSeconds = getInitialSeconds();
        
        setPhase(initialPhase);
        setSeconds(initialSeconds);
        setExerciseIndex(0);
        setRound(1);
        setWarmupStage(0);
        setCooldownStage(0);
        setRunning(false); // Pause on reset
        ProgressService.clearInProgress(workout.id);
    }, [getInitialPhase, getInitialSeconds, workout.id]);


    useEffect(() => {
        const progress = ProgressService.loadProgress();
        const pItem = progress[workout.id];
        
        if (pItem?.inProgress && pItem.snap) {
            const snap = pItem.snap;
            setPhase(snap.phase);
            setSeconds(snap.seconds);
            setExerciseIndex(Math.max(0, Math.min(snap.exerciseIndex, workout.exercises.length - 1)));
            setRound(Math.max(1, Math.min(snap.round, rounds)));
            setWarmupStage(snap.warmupStage ?? 0);
            setCooldownStage(snap.cooldownStage ?? 0);
            if (snap.sessionReps) setSessionReps(snap.sessionReps);
        } else {
             resetWorkoutState();
             setRunning(true);
        }
    }, [workout, rounds, setSessionReps, resetWorkoutState]);

    const { headerTitle, displayExercise } = useMemo(() => {
        let title: string = '';
        let exercise: Exercise = workout.warmUp;

        switch (phase) {
            case 'getready':
                title = PHASE_LABELS.getready;
                exercise = workout.preWarmUp;
                break;
            case 'warmup':
            case 'warmup_rest':
                title = phase === 'warmup_rest' ? 'Rest' : 'Work';
                exercise = warmupStage === 0 ? workout.preWarmUp : workout.warmUpExercises[(warmupStage - 1) % 3];
                break;
            case 'getready_work':
                title = PHASE_LABELS.getready_work;
                exercise = workout.exercises[0];
                break;
            case 'work':
            case 'rest':
                title = PHASE_LABELS[phase];
                exercise = workout.exercises[exerciseIndex];
                break;
            case 'getready_cooldown':
                title = PHASE_LABELS.getready_cooldown;
                exercise = workout.coolDown;
                break;
            case 'cooldown':
                title = "Work";
                exercise = workout.coolDown;
                break;
            case 'done':
                title = PHASE_LABELS.done;
                exercise = workout.coolDown;
                break;
        }
        return { headerTitle: title, displayExercise: exercise };
    }, [phase, exerciseIndex, warmupStage, workout]);

    const titleFontSize = useMemo(() => {
        const len = headerTitle.length;
        if (len > 20) return 'text-2xl';
        if (len > 14) return 'text-3xl';
        return 'text-4xl';
    }, [headerTitle]);


    const handlePhaseChange = useCallback((newPhase: WorkoutPhase) => {
        playSound(PHASE_CHANGE_SOUND);
        setPhase(newPhase);
    }, [playSound]);
    
    // Effect to handle immediate setting changes for warmup
    useEffect(() => {
        if (!running) return;
        if (!settings.enableWarmup && ['getready', 'warmup', 'warmup_rest'].includes(phase)) {
            handlePhaseChange('getready_work');
            setSeconds(10);
            setWarmupStage(0);
        }
    }, [settings.enableWarmup, phase, running, handlePhaseChange]);

    // Effect to handle immediate setting changes for cooldown
    useEffect(() => {
        if (!running) return;
        if (!settings.enableCooldown && ['getready_cooldown', 'cooldown'].includes(phase)) {
            handlePhaseChange('done');
            setSeconds(0);
            onFinish();
        }
    }, [settings.enableCooldown, phase, running, handlePhaseChange, onFinish]);


    useEffect(() => {
        if (!running) return;

        const interval = setInterval(() => {
            setSeconds(s => {
                if (s > 1) {
                    if (s <= 4) playSound(BEEP_SOUND);
                    return s - 1;
                }
                
                setNumpadVisible(false);
                setNumpadExerciseIndex(null);
                
                switch (phase) {
                    case 'getready':
                        handlePhaseChange('warmup'); setWarmupStage(0); return 55;
                    
                    case 'warmup':
                        if (warmupStage === 0) {
                            handlePhaseChange('warmup_rest'); return 5;
                        }
                        const nextStage = warmupStage + 1;
                        if (nextStage <= 6) {
                            setWarmupStage(nextStage); return 30;
                        } else {
                            handlePhaseChange('getready_work'); return 10;
                        }
                    
                    case 'warmup_rest':
                        handlePhaseChange('warmup'); setWarmupStage(1); return 30;

                    case 'getready_work':
                        handlePhaseChange('work'); setExerciseIndex(0); setRound(1); return work;

                    case 'work':
                        if (round === rounds && exerciseIndex === workout.exercises.length - 1) {
                            if (settings.enableCooldown) {
                                handlePhaseChange('getready_cooldown');
                                return 10;
                            } else {
                                handlePhaseChange('done');
                                onFinish();
                                return 0;
                            }
                        }
                        
                        handlePhaseChange('rest');
                        if (settings.trackReps) {
                            setNumpadExerciseIndex(exerciseIndex);
                            setNumpadVisible(true);
                        }
                        return rest;

                    case 'rest':
                        const nextExerciseIndex = exerciseIndex + 1;
                        if (nextExerciseIndex < workout.exercises.length) {
                            setExerciseIndex(nextExerciseIndex);
                        } else {
                            setRound(r => r + 1);
                            setExerciseIndex(0);
                        }
                        handlePhaseChange('work');
                        return work;

                    case 'getready_cooldown':
                        handlePhaseChange('cooldown'); setCooldownStage(0); return 30;

                    case 'cooldown':
                        const nextCooldownStage = cooldownStage + 1;
                        if (nextCooldownStage < 2) {
                            setCooldownStage(nextCooldownStage);
                            return 30;
                        } else {
                            handlePhaseChange('done');
                            onFinish();
                            return 0;
                        }
                }
                return 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [running, phase, work, rest, rounds, workout.exercises.length, onFinish, round, exerciseIndex, handlePhaseChange, playSound, settings, warmupStage, cooldownStage]);
    
    useEffect(() => {
        const snapshot: TimerSnapshot = { workoutId: workout.id, phase, round, exerciseIndex, seconds, sessionReps, warmupStage, cooldownStage };
        timerStateRef.current = snapshot;
        if (running && phase !== 'done') ProgressService.markInProgress(workout.id, snapshot);
    }, [workout.id, phase, round, exerciseIndex, seconds, running, sessionReps, warmupStage, cooldownStage]);

    const changeExercise = (direction: 1 | -1) => {
        let newPhase = phase;
        let newSeconds = seconds;
        let newExerciseIndex = exerciseIndex;
        let newRound = round;
        let newWarmupStage = warmupStage;
        let newCooldownStage = cooldownStage;

        if (direction === 1) { // Forward
            if (phase === 'getready') { newPhase = 'warmup'; newWarmupStage = 0; newSeconds = 55; }
            else if (phase === 'warmup_rest') { newPhase = 'warmup'; newWarmupStage = 1; newSeconds = 30; }
            else if (phase === 'warmup') {
                if (warmupStage === 0) { newPhase = 'warmup_rest'; newSeconds = 5; }
                else if (warmupStage < 6) { newWarmupStage++; newSeconds = 30; }
                else { newPhase = 'getready_work'; newSeconds = 10; }
            }
            else if (phase === 'getready_work') { newPhase = 'work'; newExerciseIndex = 0; newRound = 1; newSeconds = work; }
            else if (phase === 'work' || phase === 'rest') {
                if (phase === 'work') { newPhase = 'rest'; newSeconds = rest; }
                else { // phase is rest
                    newPhase = 'work'; newSeconds = work;
                    if (newExerciseIndex < workout.exercises.length - 1) {
                        newExerciseIndex++;
                    } else if (newRound < rounds) {
                        newExerciseIndex = 0; newRound++;
                    } else {
                        newPhase = settings.enableCooldown ? 'getready_cooldown' : 'done';
                        newSeconds = settings.enableCooldown ? 10 : 0;
                    }
                }
            }
            else if (phase === 'getready_cooldown') { newPhase = 'cooldown'; newCooldownStage = 0; newSeconds = 30; }
            else if (phase === 'cooldown') {
                if (newCooldownStage < 1) { newCooldownStage++; newSeconds = 30; }
                else { newPhase = 'done'; newSeconds = 0; }
            }
        } else { // Backward
            if (phase === 'warmup') {
                if (warmupStage > 1) { newWarmupStage--; newSeconds = 30; }
                else if (warmupStage === 1) { newPhase = 'warmup_rest'; newSeconds = 5; }
                else { newPhase = 'getready'; newSeconds = 5; }
            }
            else if (phase === 'warmup_rest') { newPhase = 'warmup'; newWarmupStage = 0; newSeconds = 55; }
            else if (phase === 'getready_work') { newPhase = 'warmup'; newWarmupStage = 6; newSeconds = 30; }
            else if (phase === 'work' || phase === 'rest') {
                 if (phase === 'rest') { newPhase = 'work'; newSeconds = work; }
                 else { // phase is work
                    newPhase = 'rest'; newSeconds = rest;
                    if (newExerciseIndex > 0) {
                        newExerciseIndex--;
                    } else if (newRound > 1) {
                        newExerciseIndex = workout.exercises.length - 1; newRound--;
                    } else {
                        newPhase = 'getready_work'; newSeconds = 10;
                    }
                 }
            }
            else if (phase === 'getready_cooldown') { newPhase = 'rest'; newExerciseIndex = workout.exercises.length - 1; newRound = rounds; newSeconds = rest; }
            else if (phase === 'cooldown') {
                if (cooldownStage > 0) { newCooldownStage--; newSeconds = 30; }
                else { newPhase = 'getready_cooldown'; newSeconds = 10; }
            }
        }

        setPhase(newPhase);
        setSeconds(newSeconds);
        setExerciseIndex(newExerciseIndex);
        setRound(newRound);
        setWarmupStage(newWarmupStage);
        setCooldownStage(newCooldownStage);
        if(newPhase === 'done') onFinish();
    };
    
    const handleNumpadDone = (value: string) => {
      if (numpadExerciseIndex !== null) {
        const numValue = parseInt(value, 10);
        const newReps = [...sessionReps];
        newReps[numpadExerciseIndex] = isNaN(numValue) ? null : numValue;
        setSessionReps(newReps);
      }
      setNumpadVisible(false);
      setNumpadExerciseIndex(null);
    };

    const canGoPrev = !(phase === 'getready') && !(phase === 'warmup' && warmupStage === 0);
    
    const phaseDuration = useMemo(() => {
        switch(phase) {
            case 'work': return work; case 'rest': return rest;
            case 'warmup': return warmupStage === 0 ? 55 : 30;
            case 'warmup_rest': return 5; case 'getready_work': return 10;
            case 'getready_cooldown': return 10; case 'cooldown': return 30;
            case 'getready': return 5; default: return 1;
        }
    }, [phase, work, rest, warmupStage]);

    const phaseFillProgress = phaseDuration > 0 ? clamp(1 - (seconds / phaseDuration)) : 0;

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: PHASE_COLORS[phase] }}>
                <div
                    className={`absolute inset-0 bg-background ${settings.enableGlassMotion ? 'transition-transform duration-200 ease-linear' : ''}`}
                    style={{
                        transformOrigin: 'top',
                        transform: settings.enableGlassMotion ? `scaleY(${phaseFillProgress})` : 'scaleY(0)',
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col flex-grow p-4">
                 <header className="flex items-center justify-between mt-2 mb-4 h-12 flex-shrink-0">
                    <div className="w-10">
                        <button onClick={onBack} className="p-2 -ml-2"><BackArrowIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 text-center min-w-0">
                        <span className={`${getPhaseTextColorClass(phase)} ${titleFontSize} font-bold uppercase tracking-widest animate-fade-in truncate`} title={headerTitle}>{headerTitle}</span>
                    </div>
                    <div className="w-10">
                         <button onClick={() => {
                            wasRunningOnSettingsOpen.current = running;
                            setRunning(false);
                            setIsSettingsOpen(true);
                         }} className="p-2"><SettingsIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <main className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-80 h-80 rounded-lg bg-gray-dark/50 flex items-center justify-center shadow-2xl">
                       {(phase === 'rest' || phase === 'warmup_rest') ? (
                            <div className="flex flex-col items-center justify-center text-rest-yellow opacity-80">
                                <RestIcon className="w-32 h-32" />
                                <span className="text-5xl font-bold uppercase tracking-widest mt-4">Rest</span>
                            </div>
                        ) : (
                            <>
                                <img src={displayExercise.image} alt={displayExercise.name} className="w-full h-full object-cover rounded-lg"/>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[-50%] bg-off-white/80 backdrop-blur-sm text-background font-bold text-lg rounded-full shadow-md max-w-[90%] flex items-center gap-2 pl-6 pr-2 py-2">
                                   <span className="truncate" title={displayExercise.name}>{displayExercise.name}</span>
                                   <button onClick={() => onShowExerciseInfo(displayExercise)} className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-black/10 rounded-full hover:bg-black/20 transition-colors" aria-label={`More info about ${displayExercise.name}`}>
                                        <InfoIcon className="w-5 h-5 text-gray-dark" />
                                   </button>
                                </div>
                            </>
                       )}
                    </div>
                    <div className="text-center">
                         <div className="text-8xl font-mono font-bold" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                            {running ? formatTime(seconds) : 'Paused'}
                         </div>
                    </div>
                </main>

                <footer className="mt-auto flex flex-col items-center flex-shrink-0">
                    <div className="flex flex-col items-center justify-center w-full">
                        <ProgressIndicator 
                            workout={workout} 
                            rounds={rounds} 
                            phase={phase} 
                            currentRound={round} 
                            currentExerciseIndex={exerciseIndex} 
                            warmupStage={warmupStage} 
                            cooldownStage={cooldownStage}
                            settings={settings}
                        />
                        <div className="flex items-center justify-center gap-8 mt-6">
                            <button onClick={() => changeExercise(-1)} disabled={!canGoPrev} className="p-4 text-off-white/80 rounded-full hover:bg-black/20 disabled:opacity-30 transition-colors">
                                <PrevIcon className="w-8 h-8" />
                            </button>
                            <button onClick={() => setRunning(!running)} className="w-32 h-16 bg-off-white text-background rounded-3xl flex items-center justify-center transition-transform active:scale-95 shadow-lg">
                                {running ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                            </button>
                            <button onClick={() => changeExercise(1)} disabled={phase === 'done'} className="p-4 text-off-white/80 rounded-full hover:bg-black/20 disabled:opacity-30 transition-colors">
                                <NextIcon className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
            
            {numpadVisible && numpadExerciseIndex !== null && (
              <Numpad
                exerciseName={workout.exercises[numpadExerciseIndex].name}
                initialValue={String(sessionReps[numpadExerciseIndex] ?? '')}
                onDone={handleNumpadDone}
                onClose={() => { setNumpadVisible(false); setNumpadExerciseIndex(null); }}
              />
            )}
            {isSettingsOpen && (
                <SettingsModal
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onClose={() => setIsSettingsOpen(false)}
                    onExit={onBack}
                    onReset={() => {
                        resetWorkoutState();
                        setIsSettingsOpen(false);
                    }}
                    onSaveAndResume={() => {
                        setIsSettingsOpen(false);
                        if (wasRunningOnSettingsOpen.current) {
                            setRunning(true);
                        }
                    }}
                />
            )}
        </div>
    );
};
