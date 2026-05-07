import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Workout, Exercise, WorkoutPhase, Settings } from '../types';
import { BackArrowIcon, InfoIcon, PauseIcon, PlayIcon, NextIcon, PrevIcon, SettingsIcon, RestIcon } from './icons';
import { Numpad } from './RepTrackingScreen';
import { useTimer } from '../hooks/useTimer';

const PHASE_COLORS: Record<WorkoutPhase, string> = {
  work: '#84cc16',          // Olive
  rest: '#f97316',          // Safety Orange
  warmup: '#84cc16',        
  warmup_rest: '#f97316',   
  getready: '#334155',      
  getready_work: '#334155', 
  getready_cooldown: '#334155', 
  cooldown: '#84cc16',      
  done: '#0f172a',          
};

const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900 p-8 w-[95vw] max-w-sm space-y-6 rounded-[40px] border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-black text-center tracking-widest text-white uppercase border-b border-white/5 pb-4">TACTICAL CONFIG</h2>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-bold text-gray-200">Audio Cues</span>
                        <button onClick={() => handleSettingChange('audioCues', !settings.audioCues)} className={`w-12 h-6 rounded-full transition-colors ${settings.audioCues ? 'bg-accent' : 'bg-gray-700'} relative`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.audioCues ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-bold text-gray-200">Rep Tracking</span>
                        <button onClick={() => handleSettingChange('trackReps', !settings.trackReps)} className={`w-12 h-6 rounded-full transition-colors ${settings.trackReps ? 'bg-accent' : 'bg-gray-700'} relative`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.trackReps ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {settings.trackReps && (
                        <div className="flex justify-between items-center py-2 pl-4 border-l-2 border-gray-800">
                            <span className="text-sm font-bold text-gray-400">Auto-Pause Timer</span>
                            <button onClick={() => handleSettingChange('pauseOnRepCount', !settings.pauseOnRepCount)} className={`w-12 h-6 rounded-full transition-colors ${settings.pauseOnRepCount ? 'bg-accent' : 'bg-gray-700'} relative`}>
                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.pauseOnRepCount ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-bold text-gray-200">Immersive Mode</span>
                        <button onClick={() => handleSettingChange('enableColor', !settings.enableColor)} className={`w-12 h-6 rounded-full transition-colors ${settings.enableColor ? 'bg-accent' : 'bg-gray-700'} relative`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.enableColor ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className={`flex justify-between items-center py-2 ${!isWakeLockSupported ? 'opacity-50' : ''}`}>
                        <span className="text-sm font-bold text-gray-200">Keep Screen On</span>
                        <button disabled={!isWakeLockSupported} onClick={() => handleSettingChange('enableWakeLock', !settings.enableWakeLock)} className={`w-12 h-6 rounded-full transition-colors ${settings.enableWakeLock ? 'bg-accent' : 'bg-gray-700'} relative`}>
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.enableWakeLock ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <button onClick={onSaveAndResume} className="w-full text-center bg-accent text-black rounded-2xl font-black py-3 transition-transform active:scale-95 uppercase tracking-widest shadow-lg">Resume Session</button>
                    <button onClick={onReset} className="w-full text-center bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold py-3 transition-colors uppercase tracking-widest">Abort & Restart</button>
                    <button onClick={onExit} className="w-full text-center bg-rest-orange/10 hover:bg-rest-orange/20 text-rest-orange border border-rest-orange/20 rounded-2xl font-bold py-3 transition-colors uppercase tracking-widest">Extract (Exit)</button>
                </div>
                <button onClick={onClose} className="w-full text-gray-500 font-bold uppercase tracking-widest text-xs">Back to Mission</button>
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
        workout, settings, sessionReps, setSessionReps, onFinish,
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
        phase, seconds, running, round, exerciseIndex, warmupStage,
        headerTitle, displayExercise, nextUpExercise, canGoPrev,
        togglePlayPause, changeExercise, resetWorkoutState, setRunning
    } = timer;

    const phaseDuration = useMemo(() => {
        switch(phase) {
            case 'work': return workout.work;
            case 'rest': return workout.rest;
            case 'warmup': return 30;
            case 'warmup_rest': return 5;
            case 'getready_work': return 5;
            case 'getready_cooldown': return 5;
            case 'cooldown': return 30;
            case 'getready': return 5;
            default: return 1;
        }
    }, [phase, workout]);

    const progressPercent = useMemo(() => (seconds / phaseDuration) * 100, [seconds, phaseDuration]);
    
    const isMainWorkoutPhase = phase === 'work' || phase === 'rest' || phase === 'getready_work';
    const isRest = phase === 'rest' || phase === 'warmup_rest';

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-off-white font-sans selection:bg-accent selection:text-black">
            
            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-5 z-0" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            {/* HUD Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
                <div className="w-full h-1 bg-white/20 blur-sm animate-hud-scan"></div>
            </div>

            {/* Emptying Glass Effect - Solid Tactical Color */}
            {settings.enableColor && (
                 <div 
                    className="absolute bottom-0 left-0 right-0 w-full transition-[height] duration-1000 ease-linear z-0"
                    style={{ 
                        height: `${progressPercent}%`,
                        backgroundColor: PHASE_COLORS[phase],
                        opacity: 0.15
                    }}
                />
            )}
            
            {/* HUD Header */}
            <header className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Session Clock</span>
                    <span className="text-lg font-mono font-bold text-accent tracking-tighter">MISSION: ACTIVE</span>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => {
                        wasRunningOnSettingsOpen.current = running;
                        setRunning(false);
                        setIsSettingsOpen(true);
                    }} className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all">
                         <SettingsIcon className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-xl transition-all">
                        <BackArrowIcon className="w-4 h-4 text-white" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                
                {/* Media Window */}
                <div className="relative w-full aspect-square max-w-[220px] group">
                    <div className="absolute -inset-1 border border-white/5 rounded-[40px] pointer-events-none"></div>
                    <div className="w-full h-full rounded-[38px] bg-gray-900 border border-white/10 shadow-2xl overflow-hidden relative backdrop-blur-3xl flex items-center justify-center">
                        {isRest ? (
                            <div className="flex flex-col items-center text-center p-6 space-y-4">
                                <RestIcon className="w-20 h-20 text-rest-orange drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Incoming</p>
                                    <p className="text-base font-black text-white uppercase">{nextUpExercise?.name || "FINISH"}</p>
                                </div>
                            </div>
                        ) : (
                            displayExercise.video ? (
                                <video key={displayExercise.video} src={displayExercise.video} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                            ) : (
                                <img src={displayExercise.image} alt={displayExercise.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )
                        )}
                        
                        {/* Biomechanical Tip Overlay */}
                        {!isRest && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md border-t border-white/10">
                                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1">Form Cue</p>
                                <p className="text-xs text-white leading-snug italic line-clamp-2">&quot;{displayExercise.description[0]}&quot;</p>
                            </div>
                        )}
                    </div>

                    {/* Exercise Identifier Badge */}
                    {!isRest && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 bg-gray-900 border border-white/10 px-4 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl">
                            <span className="text-sm font-black text-white uppercase tracking-tight">{displayExercise.name}</span>
                            <button onClick={() => onShowExerciseInfo(displayExercise)} className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-gray-400">
                                <InfoIcon className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Tactical Timer HUD */}
                <div className="flex flex-col items-center space-y-4 w-full">
                    {isMainWorkoutPhase && (
                         <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Round</span>
                            <span className="text-lg font-black font-mono text-white">{round} <span className="text-gray-600">/</span> {workout.rounds}</span>
                         </div>
                    )}

                    <div className="text-[4.5rem] sm:text-[6rem] font-black font-mono tracking-tighter text-white leading-[0.8] drop-shadow-2xl">
                        {formatTime(seconds)}
                    </div>

                    {/* Progress Gauge */}
                    {isMainWorkoutPhase && (
                        <div className="flex gap-2 w-full max-w-[280px]">
                            {workout.exercises.map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i === exerciseIndex ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : i < exerciseIndex ? 'bg-accent' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Controls Bar */}
            <footer className="relative z-10 flex items-center justify-between p-6 pt-2 flex-shrink-0">
                <button onClick={() => changeExercise(-1)} disabled={!canGoPrev} className="w-10 h-10 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center disabled:opacity-20 active:scale-95 transition-all">
                    <PrevIcon className="w-4 h-4 text-white" />
                </button>
                
                <button 
                    onClick={togglePlayPause} 
                    className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all active:scale-95 shadow-xl ${running ? 'bg-white text-black' : 'bg-accent text-black shadow-[0_0_30px_rgba(132,204,22,0.4)]'}`}
                >
                    {running ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 pl-1" />}
                </button>
                
                <button onClick={() => changeExercise(1)} disabled={phase === 'done'} className="w-10 h-10 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center disabled:opacity-20 active:scale-95 transition-all">
                    <NextIcon className="w-4 h-4 text-white" />
                </button>
            </footer>
            
            {numpadVisible && numpadExerciseIndex !== null && (
              <Numpad
                exerciseName={workout.exercises[numpadExerciseIndex].name}
                initialValue={String(sessionReps[numpadExerciseIndex]?.[round - 1] ?? '')}
                onDone={(val) => {
                    const numValue = parseInt(val, 10);
                    const newReps = sessionReps.map(r => [...r]);
                    if (newReps[numpadExerciseIndex]) {
                        newReps[numpadExerciseIndex][round - 1] = isNaN(numValue) ? null : numValue;
                        setSessionReps(newReps);
                    }
                    setNumpadVisible(false);
                    if (settings.pauseOnRepCount) setRunning(true);
                }}
                onClose={() => {
                    setNumpadVisible(false);
                    if (settings.pauseOnRepCount) setRunning(true);
                }}
              />
            )}
            
            {isSettingsOpen && (
                <SettingsModal
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onClose={() => setIsSettingsOpen(false)}
                    onExit={onBack}
                    onReset={() => { resetWorkoutState(true); setIsSettingsOpen(false); }}
                    onSaveAndResume={() => { setIsSettingsOpen(false); if (wasRunningOnSettingsOpen.current) setRunning(true); }}
                    isWakeLockSupported={isWakeLockSupported}
                />
            )}
        </div>
    );
};