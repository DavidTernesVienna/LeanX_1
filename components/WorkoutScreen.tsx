
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Workout, Exercise, WorkoutPhase, Settings } from '../types';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon, SettingsIcon, RestIcon } from './icons';
import { Numpad } from './RepTrackingScreen';
import { useTimer } from '../hooks/useTimer';

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
    const baseClasses = "w-3 h-3 rounded-full transition-colors";
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
        <div className="flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </div>
    );

    return (
        <div className="flex items-stretch justify-center gap-2 text-sm text-gray-text uppercase font-semibold w-full">
            {settings.enableWarmup && (
                <>
                    <div className="flex flex-col items-center gap-1 bg-black/20 p-3 rounded-lg">
                         <span className="text-center">Warm Up</span>
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
            
            <div className="flex flex-col items-center gap-1 bg-black/20 p-3 rounded-lg">
                <span className="text-center">HIIT</span>
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
                    <div className="flex flex-col items-center gap-1 bg-black/20 p-3 rounded-lg">
                        <span className="text-center">Cool Down</span>
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
  disabled?: boolean;
}> = ({ label, labelId, checked, onChange, disabled = false }) => (
  <div className={`flex justify-between items-center ${disabled ? 'opacity-50' : ''}`}>
    <label id={labelId} className="font-medium text-off-white/90">{label}</label>
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-gray-light'} ${disabled ? 'cursor-not-allowed' : ''}`}
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
}> = ({ onConfirm, duration = 500, children, className }) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    startTimeRef.current = Date.now();
    
    const animate = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
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
    isWakeLockSupported: boolean;
}> = ({ settings, onUpdateSettings, onClose, onExit, onReset, onSaveAndResume, isWakeLockSupported }) => {

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
                    <ToggleSwitch 
                      label="Keep Screen On" 
                      labelId="wake-lock-modal" 
                      checked={settings.enableWakeLock} 
                      onChange={() => handleSettingChange('enableWakeLock', !settings.enableWakeLock)}
                      disabled={!isWakeLockSupported}
                    />
                    
                    <div>
                        <ToggleSwitch 
                            label="Color" 
                            labelId="enable-color" 
                            checked={settings.enableColor} 
                            onChange={() => handleSettingChange('enableColor', !settings.enableColor)} 
                        />
                        <div className="pl-6 pt-3 mt-3 border-l-2 border-gray-light/50 ml-1">
                            <ToggleSwitch 
                                label="Motion" 
                                labelId="enable-glass-motion" 
                                checked={settings.enableGlassMotion} 
                                onChange={() => handleSettingChange('enableGlassMotion', !settings.enableGlassMotion)} 
                                disabled={!settings.enableColor}
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-light">
                     <button onClick={onSaveAndResume} className="w-full text-center bg-green-900 hover:bg-green-800 text-off-white font-bold py-3 rounded-full transition-colors">Save & Resume</button>
                    <HoldButton onConfirm={onReset} className="w-full text-center bg-yellow-900 hover:bg-yellow-800 text-off-white font-bold py-3 rounded-full transition-colors">Reset Workout</HoldButton>
                    <HoldButton onConfirm={onExit} className="w-full text-center bg-red-900 hover:bg-red-800 text-off-white font-bold py-3 rounded-full transition-colors">Exit Workout</HoldButton>
                </div>
            </div>
        </div>
    );
};


export const WorkoutScreen: React.FC<{
    workout: Workout;
    settings: Settings;
    onUpdateSettings: (newSettings: Settings) => void;
    sessionReps: (number | null)[][];
    setSessionReps: React.Dispatch<React.SetStateAction<(number | null)[][]>>;
    onBack: () => void;
    onFinish: () => void;
    onShowExerciseInfo: (exercise: Exercise) => void;
    onSaveAndExit: () => void;
    isWakeLockSupported: boolean;
}> = ({ workout, settings, onUpdateSettings, sessionReps, setSessionReps, onBack, onFinish, onShowExerciseInfo, onSaveAndExit, isWakeLockSupported }) => {
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const wasRunningOnSettingsOpen = useRef(false);
    const [numpadVisible, setNumpadVisible] = useState(false);
    const [numpadExerciseIndex, setNumpadExerciseIndex] = useState<number | null>(null);

    const timer = useTimer({
        workout,
        settings,
        sessionReps,
        setSessionReps,
        onFinish,
        onNumpadOpen: (exIndex) => {
            if (exIndex === -1) {
                setNumpadVisible(false);
                setNumpadExerciseIndex(null);
            } else {
                setNumpadExerciseIndex(exIndex);
                setNumpadVisible(true);
            }
        }
    });

    const {
        phase, seconds, running, round, exerciseIndex, warmupStage, cooldownStage,
        headerTitle, displayExercise, nextUpExercise, canGoPrev,
        togglePlayPause, changeExercise, resetWorkoutState, setRunning
    } = timer;

    // --- Screen Wake Lock ---
    useEffect(() => {
        let wakeLock: any = null;

        const request = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                wakeLock = await (navigator as any).wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock was released.');
                    wakeLock = null; 
                });
                console.log('Wake Lock is active.');
            } catch (err: any) {
                console.error(`Wake Lock request failed: ${err.name}, ${err.message}`);
            }
        };
        
        const release = async () => {
            if (wakeLock) {
                await wakeLock.release();
                wakeLock = null;
            }
        };

        const handleVisibilityChange = () => {
            if (settings.enableWakeLock && document.visibilityState === 'visible') {
                request();
            }
        };

        if (settings.enableWakeLock && 'wakeLock' in navigator) {
            request();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            release();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [settings.enableWakeLock]);

    const handleTogglePlayPause = useCallback(() => {
        togglePlayPause();
    }, [togglePlayPause]);

    const titleFontSize = useMemo(() => {
        const len = displayExercise.name.length;
        if (len > 20) return 'text-2xl';
        if (len > 14) return 'text-3xl';
        return 'text-4xl';
    }, [displayExercise]);
    
    const closeNumpadAndResume = useCallback(() => {
        setNumpadVisible(false);
        setNumpadExerciseIndex(null);
        if (settings.trackReps && settings.pauseOnRepCount) {
            if (phase !== 'done') {
                setRunning(true);
            }
        }
    }, [settings, setRunning, phase]);

    const handleNumpadDone = (value: string) => {
      if (numpadExerciseIndex !== null) {
        const numValue = parseInt(value, 10);
        const newReps = sessionReps.map(r => [...r]);
        if (newReps[numpadExerciseIndex] && (round - 1) < newReps[numpadExerciseIndex].length) {
            newReps[numpadExerciseIndex][round - 1] = isNaN(numValue) ? null : numValue;
            setSessionReps(newReps);
        }
      }
      closeNumpadAndResume();
    };

    const phaseDuration = useMemo(() => {
        switch(phase) {
            case 'work': return workout.work;
            case 'rest': return workout.rest;
            case 'warmup': {
                const isSpecialPreWarmup = warmupStage === 0 && (workout.preWarmUp.name === 'Standing March' || workout.preWarmUp.name === 'Jumping Jacks');
                return isSpecialPreWarmup ? 55 : 30;
            }
            case 'warmup_rest': return 5;
            case 'getready_work': return 5;
            case 'getready_cooldown': return 5;
            case 'cooldown': return 30;
            case 'getready': return 5;
            default: return 1;
        }
    }, [phase, workout, warmupStage]);

    const phaseFillProgress = phaseDuration > 0 ? clamp(1 - (seconds / phaseDuration)) : 0;
    const finalBackgroundColor = settings.enableColor ? PHASE_COLORS[phase] : 'transparent';
    const overlayTransform = (settings.enableColor && settings.enableGlassMotion)
        ? `scaleY(${phaseFillProgress})` // This goes from 0 to 1, growing overlay downwards
        : (settings.enableColor ? 'scaleY(0)' : 'scaleY(1)'); // If color on but no motion, overlay is gone. If color off, overlay is full.


    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: finalBackgroundColor }}>
                 <div
                    className={`absolute inset-0 bg-background transition-transform duration-200 ease-linear`}
                    style={{
                        transformOrigin: 'top',
                        transform: overlayTransform,
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col flex-grow p-4">
                 <header className="flex items-center justify-between mt-2 mb-4 h-12 flex-shrink-0">
                    <div className="w-10">
                        <button onClick={onBack} className="p-2 -ml-2"><BackArrowIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 text-center min-w-0">
                        <span className={`${getPhaseTextColorClass(phase)} text-5xl font-bold uppercase tracking-widest animate-fade-in truncate`} title={headerTitle}>{headerTitle}</span>
                    </div>
                    <div className="w-10">
                         <button onClick={() => {
                            wasRunningOnSettingsOpen.current = running;
                            setRunning(false);
                            setIsSettingsOpen(true);
                         }} className="p-2"><SettingsIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <div className="flex-grow flex flex-col justify-around items-center">
                    <main className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-80 h-80 rounded-lg bg-gray-dark/50 flex items-center justify-center shadow-2xl">
                        {(phase === 'rest' || phase === 'warmup_rest') ? (
                            <div className="w-full h-full flex flex-col justify-between items-center">
                                <div className="flex-grow flex flex-col items-center justify-center text-white">
                                    <RestIcon className="w-32 h-32 opacity-80" />
                                    <span className="text-5xl font-bold uppercase tracking-widest mt-4 text-white">NEXT UP</span>
                                </div>
                                {nextUpExercise && (
                                    <div className="w-full bg-black/30 p-3 rounded-b-lg animate-fade-in">
                                        <div className="flex items-center gap-4">
                                            <img src={nextUpExercise.image} alt={nextUpExercise.name} className="w-12 h-12 rounded-md object-cover bg-gray-light flex-shrink-0" />
                                            <div className="flex-grow min-w-0">
                                                <p className="text-off-white text-xl truncate font-semibold">{nextUpExercise.name}</p>
                                            </div>
                                            <button onClick={() => onShowExerciseInfo(nextUpExercise)} className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0" aria-label={`More info about ${nextUpExercise.name}`}>
                                                <InfoIcon className="w-6 h-6 text-off-white" />
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                        <div className="text-center w-80">
                            <div className="text-8xl font-mono font-bold" style={{textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                                {formatTime(seconds)}
                            </div>
                        </div>
                    </main>

                    <footer className="flex flex-col items-center flex-shrink-0">
                        <div className="flex flex-col items-center justify-center w-full">
                            <ProgressIndicator 
                                workout={workout} 
                                rounds={workout.rounds} 
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
                                <button onClick={handleTogglePlayPause} className="w-32 h-16 bg-off-white text-background rounded-3xl flex items-center justify-center transition-transform active:scale-95 shadow-lg">
                                    {running ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                                </button>
                                <button onClick={() => changeExercise(1)} disabled={phase === 'done'} className="p-4 text-off-white/80 rounded-full hover:bg-black/20 disabled:opacity-30 transition-colors">
                                    <NextIcon className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
            
            {numpadVisible && numpadExerciseIndex !== null && (
              <Numpad
                exerciseName={workout.exercises[numpadExerciseIndex].name}
                initialValue={String(sessionReps[numpadExerciseIndex]?.[round - 1] ?? '')}
                onDone={handleNumpadDone}
                onClose={closeNumpadAndResume}
              />
            )}
            {isSettingsOpen && (
                <SettingsModal
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onClose={() => setIsSettingsOpen(false)}
                    onExit={onBack}
                    onReset={() => {
                        resetWorkoutState(true);
                        setIsSettingsOpen(false);
                    }}
                    onSaveAndResume={() => {
                        setIsSettingsOpen(false);
                        if (wasRunningOnSettingsOpen.current) {
                            setRunning(true);
                        }
                    }}
                    isWakeLockSupported={isWakeLockSupported}
                />
            )}
        </div>
    );
};
