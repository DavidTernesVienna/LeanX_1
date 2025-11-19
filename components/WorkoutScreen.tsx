
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Workout, Exercise, WorkoutPhase, Settings } from '../types';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon, SettingsIcon, RestIcon } from './icons';
import { Numpad } from './RepTrackingScreen';
import { useTimer } from '../hooks/useTimer';

const PHASE_COLORS: Record<WorkoutPhase, string> = {
  work: '#16a34a',          // green-600
  rest: '#b45309',          // amber-700
  warmup: '#2563eb',        // blue-600
  warmup_rest: '#b45309',   // amber-700
  getready: '#334155',      // slate-700
  getready_work: '#334155', // slate-700
  getready_cooldown: '#334155', // slate-700
  cooldown: '#0d9488',      // teal-600
  done: '#111827',          // gray-900
};

const getPhaseTextColorClass = (phase: WorkoutPhase): string => {
  switch (phase) {
    case 'rest':
    case 'warmup_rest':
      return 'text-amber-500';
    case 'getready':
    case 'getready_work':
    case 'getready_cooldown':
      return 'text-slate-400';
    case 'work':
      return 'text-green-500';
    case 'warmup':
      return 'text-blue-400';
    case 'cooldown':
      return 'text-teal-400';
    default:
      return 'text-off-white';
  }
};

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

// Rounded Segment for Progress
const Segment: React.FC<{ status: 'done' | 'active' | 'pending', type?: 'warmup' | 'work' | 'cooldown', isLast?: boolean }> = ({ status, type = 'work', isLast }) => {
    const baseClasses = "h-2 flex-1 transition-all duration-500 rounded-full"; 
    
    let activeColor = 'bg-accent shadow-[0_0_10px_rgba(74,222,128,0.8)]';
    let doneColor = 'bg-accent/40';
    let pendingColor = 'bg-gray-800';
    
    if(type === 'warmup') {
        activeColor = 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]';
        doneColor = 'bg-blue-500/40';
    }
    if(type === 'cooldown') {
        activeColor = 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]';
        doneColor = 'bg-teal-500/40';
    }

    if (status === 'done') return <div className={`${baseClasses} ${doneColor}`}></div>;
    if (status === 'active') return <div className={`${baseClasses} ${activeColor} scale-y-150 relative z-10`}></div>;
    return <div className={`${baseClasses} ${pendingColor}`}></div>;
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
        if (phase === 'rest') return 'done'; // Completed the work part

        return 'pending';
    };

    const getWarmupStatus = (index: number): 'done' | 'active' | 'pending' => {
        if (phase === 'getready') return 'pending';
        if (!phase.startsWith('warmup')) return 'done';
        if (index < warmupStage) return 'done';
        if (index === warmupStage) return 'active';
        return 'pending';
    };

    const getCooldownStatus = (index: number): 'done' | 'active' | 'pending' => {
         if (phase === 'done') return 'done';
         if (phase !== 'cooldown' && phase !== 'getready_cooldown') return 'pending';
         if (index < cooldownStage) return 'done';
         if (index === cooldownStage) return 'active';
         return 'pending';
    };

    return (
        <div className="w-full max-w-md px-4 space-y-3 bg-gray-900/40 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
            {/* Text Labels */}
            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                <span>Warmup</span>
                <span>Progress</span>
                <span>Cool</span>
            </div>

            {/* Progress Bars */}
            <div className="flex items-center gap-2 h-3">
                 {settings.enableWarmup && (
                    <div className="flex w-1/6 gap-1">
                         <Segment status={getWarmupStatus(0)} type="warmup" />
                         <Segment status={getWarmupStatus(1)} type="warmup" />
                         <Segment status={getWarmupStatus(4)} type="warmup" />
                    </div>
                )}
                
                <div className="flex-grow flex gap-1.5">
                     {Array.from({ length: rounds }).map((_, rIdx) => (
                        <div key={rIdx} className="flex-grow flex gap-1">
                            {workout.exercises.map((_, exIdx) => (
                                <Segment key={`${rIdx}-${exIdx}`} status={getStatus(rIdx + 1, exIdx)} type="work" />
                            ))}
                        </div>
                     ))}
                </div>

                 {settings.enableCooldown && (
                    <div className="flex w-1/6 gap-1">
                        <Segment status={getCooldownStatus(1)} type="cooldown" />
                        <Segment status={getCooldownStatus(2)} type="cooldown" />
                    </div>
                )}
            </div>
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
    <label id={labelId} className="font-bold text-xs uppercase text-gray-400 tracking-wide">{label}</label>
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border border-transparent ${checked ? 'bg-accent/20 border-accent' : 'bg-gray-800'} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6 bg-accent' : 'translate-x-1 bg-gray-500'}`}
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
      className={`relative overflow-hidden rounded-xl ${className}`}
    >
      <span className="relative z-10 font-bold uppercase tracking-widest">{children}</span>
      <div
        className="absolute top-0 left-0 h-full bg-white/10 transition-all duration-75 ease-linear"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900 p-6 w-[90vw] max-w-sm space-y-6 m-4 rounded-3xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                
                <h2 className="text-lg font-bold text-center tracking-wider text-white uppercase border-b border-white/5 pb-4">Settings</h2>
                <div className="space-y-4">
                    <ToggleSwitch label="Warm Up Phase" labelId="warmup-toggle" checked={settings.enableWarmup} onChange={() => handleSettingChange('enableWarmup', !settings.enableWarmup)} />
                    <ToggleSwitch label="Cool Down Phase" labelId="cooldown-toggle" checked={settings.enableCooldown} onChange={() => handleSettingChange('enableCooldown', !settings.enableCooldown)} />
                    <ToggleSwitch label="Audio Feedback" labelId="audio-toggle" checked={settings.audioCues} onChange={() => handleSettingChange('audioCues', !settings.audioCues)} />
                    <ToggleSwitch 
                      label="Screen Wake Lock" 
                      labelId="wake-lock-modal" 
                      checked={settings.enableWakeLock} 
                      onChange={() => handleSettingChange('enableWakeLock', !settings.enableWakeLock)}
                      disabled={!isWakeLockSupported}
                    />
                    <ToggleSwitch 
                        label="Immersive Mode" 
                        labelId="enable-color" 
                        checked={settings.enableColor} 
                        onChange={() => handleSettingChange('enableColor', !settings.enableColor)} 
                    />
                </div>
                <div className="space-y-3 pt-4 border-t border-white/5">
                     <button onClick={onSaveAndResume} className="w-full text-center bg-accent text-black rounded-xl font-bold py-3 transition-transform active:scale-95 uppercase tracking-wider shadow-[0_0_15px_rgba(74,222,128,0.3)]">Resume Workout</button>
                    <HoldButton onConfirm={onReset} className="w-full text-center bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 text-sm font-bold py-3 transition-colors">Reset Timer</HoldButton>
                    <HoldButton onConfirm={onExit} className="w-full text-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-bold py-3 transition-colors">End Workout</HoldButton>
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

    useEffect(() => {
        let wakeLock: any = null;

        const request = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                wakeLock = await (navigator as any).wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    wakeLock = null; 
                });
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

    const shouldPulse = settings.enableColor && (phase === 'work' || phase === 'warmup' || phase === 'cooldown') && running;

    // Determine Phase Badge Color
    const phaseBadgeColor = useMemo(() => {
        if (phase === 'work') return 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
        if (phase === 'rest' || phase === 'warmup_rest') return 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
        if (phase === 'warmup') return 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
        if (phase === 'cooldown') return 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]';
        return 'bg-gray-700/50 border-gray-500 text-gray-400';
    }, [phase]);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-black text-white font-sans selection:bg-accent selection:text-black">
            
            {/* Background Grid Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
            </div>
            
            {/* Pulsing Alert Background for Intense Phases */}
             <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${shouldPulse ? 'opacity-30' : 'opacity-0'}`}
                  style={{ background: `radial-gradient(circle at center, ${PHASE_COLORS[phase]} 0%, transparent 70%)` }}>
            </div>


            {/* Main Layout */}
            <div className="relative z-10 flex flex-col flex-grow p-4 max-w-md mx-auto w-full h-full justify-between">
                 
                 {/* Top HUD Bar */}
                 <header className="flex items-center justify-between mt-2 h-16 pb-2">
                    <button onClick={onBack} className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
                        <BackArrowIcon className="w-5 h-5 text-gray-300" />
                    </button>
                    
                    <div className={`px-6 py-2 rounded-full border backdrop-blur-md transition-all duration-500 ${phaseBadgeColor}`}>
                        <span className="font-bold text-sm tracking-widest uppercase">
                            {headerTitle}
                        </span>
                    </div>

                     <button onClick={() => {
                        wasRunningOnSettingsOpen.current = running;
                        setRunning(false);
                        setIsSettingsOpen(true);
                     }} className="w-11 h-11 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
                         <SettingsIcon className="w-5 h-5 text-gray-300" />
                     </button>
                </header>

                {/* Central Data Display */}
                <main className="flex-grow flex flex-col items-center justify-center space-y-6 py-2 relative">
                    
                    {/* Media Frame (Glass Card Look) */}
                    <div className="relative w-full aspect-square max-w-sm rounded-[32px] bg-gray-900/40 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden group backdrop-blur-md">
                        
                        {/* Live Feed Indicator */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
                        </div>

                        {(phase === 'rest' || phase === 'warmup_rest') ? (
                            <div className="w-full h-full flex flex-col relative z-10">
                                <div className="flex-grow flex flex-col items-center justify-center text-white bg-gradient-to-b from-amber-900/20 to-black/80">
                                    <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-pulse">
                                        <RestIcon className="w-12 h-12 text-amber-500" />
                                    </div>
                                    <span className="text-xl font-bold uppercase tracking-widest text-amber-400/90">Rest</span>
                                    <div className="text-6xl font-bold mt-2 text-amber-500 tabular-nums tracking-tighter">{seconds}</div>
                                </div>
                                {nextUpExercise && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 border-t border-white/10 p-4 backdrop-blur-xl">
                                        <p className="text-[10px] text-accent font-bold uppercase mb-1.5 tracking-wider">Up Next</p>
                                        <div className="flex items-center gap-3">
                                            <img src={nextUpExercise.image} alt={nextUpExercise.name} className="w-12 h-12 rounded-xl border border-white/10 object-cover bg-gray-800 flex-shrink-0 grayscale" />
                                            <p className="text-white text-sm font-bold truncate">{nextUpExercise.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            ) : (
                                <>
                                    {displayExercise.video ? (
                                        <video
                                            key={displayExercise.name + displayExercise.video}
                                            src={displayExercise.video}
                                            className="w-full h-full object-cover opacity-90"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img src={displayExercise.image} alt={displayExercise.name} className="w-full h-full object-cover opacity-90"/>
                                    )}
                                    
                                    {/* Objective Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5 pt-12">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] text-accent font-bold uppercase tracking-widest block mb-1">Exercise</span>
                                                <span className="text-2xl font-black text-white leading-none uppercase tracking-tight">{displayExercise.name}</span>
                                            </div>
                                            <button onClick={() => onShowExerciseInfo(displayExercise)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors backdrop-blur-md">
                                                <InfoIcon className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                        )}
                    </div>

                    {/* Timer */}
                    {(phase !== 'rest' && phase !== 'warmup_rest') && (
                         <div className="relative w-full flex flex-col items-center justify-center py-2">
                            <div className={`text-9xl font-black tracking-tighter ${getPhaseTextColorClass(phase)} tabular-nums leading-none drop-shadow-2xl`}>
                                {formatTime(seconds)}
                            </div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">Time Remaining</div>
                        </div>
                    )}
                </main>

                {/* Bottom Controls */}
                <footer className="flex flex-col items-center flex-shrink-0 gap-5 mb-2">
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
                    
                    {/* Control Deck */}
                    <div className="grid grid-cols-3 gap-4 w-full items-center pt-2">
                        <button onClick={() => changeExercise(-1)} disabled={!canGoPrev} className="flex flex-col items-center justify-center py-4 rounded-2xl bg-gray-800/50 border border-white/5 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 group">
                            <PrevIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                        
                        <button 
                            onClick={handleTogglePlayPause} 
                            className={`h-20 rounded-3xl flex items-center justify-center border-2 transition-all active:scale-95 shadow-lg ${running ? 'border-gray-500 bg-white text-black hover:bg-gray-200' : 'border-accent bg-accent/10 text-accent hover:bg-accent/20 hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]'}`}
                        >
                            {running ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                        </button>
                        
                        <button onClick={() => changeExercise(1)} disabled={phase === 'done'} className="flex flex-col items-center justify-center py-4 rounded-2xl bg-gray-800/50 border border-white/5 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 group">
                            <NextIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </footer>
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
