import { useState, useEffect, useMemo, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import type { Workout, Exercise, WorkoutPhase, TimerSnapshot, Settings } from '../types';
import * as ProgressService from '../services/progressService';

interface UseTimerProps {
    workout: Workout;
    settings: Settings;
    sessionReps: (number | null)[][];
    // FIX: Imported Dispatch and SetStateAction from 'react' to resolve namespace errors.
    setSessionReps: Dispatch<SetStateAction<(number | null)[][]>>;
    onFinish: () => void;
    onNumpadOpen: (exerciseIndex: number) => void;
}

const WARMUP_EXERCISE_ROUNDS = 2;
const COOLDOWN_ROUNDS = 2;
const TOTAL_WARMUP_STAGES = 1 + (WARMUP_EXERCISE_ROUNDS * 3); // 1 pre-warmup + 2 rounds of 3 exercises
const GET_READY_DURATION = 5;

export const useTimer = ({ workout, settings, sessionReps, setSessionReps, onFinish, onNumpadOpen }: UseTimerProps) => {
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState<WorkoutPhase>('getready');
    const [round, setRound] = useState(1);
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [seconds, setSeconds] = useState(GET_READY_DURATION);
    const [warmupStage, setWarmupStage] = useState(0); // 0:pre-warmup, 1-3: round 1, 4-6: round 2
    const [cooldownStage, setCooldownStage] = useState(1); // 1-2: cooldown rounds

    const snapshotRef = useRef<TimerSnapshot | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playSound = useCallback((duration: number, frequency = 440) => {
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
                return;
            }
        }
        const audioCtx = audioCtxRef.current;
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }, []);

    const resetWorkoutState = (isFullReset: boolean) => {
        const uid = ProgressService.getWorkoutUID(workout);
        const progress = ProgressService.loadProgress();
        const snap = progress[uid]?.snap;
        
        if (!isFullReset && snap) { // Resume
            setPhase(snap.phase);
            setRound(snap.round);
            setExerciseIndex(snap.exerciseIndex);
            setSeconds(snap.seconds);
            if(snap.sessionReps) setSessionReps(snap.sessionReps);
            setWarmupStage(snap.warmupStage ?? 0);
            setCooldownStage(snap.cooldownStage ?? 1);
        } else { // Start new
            const startPhase: WorkoutPhase = settings.enableWarmup ? 'getready' : 'getready_work';
            const startSeconds = GET_READY_DURATION;
            
            setPhase(startPhase);
            setSeconds(startSeconds);
            setRound(1);
            setExerciseIndex(0);
            setWarmupStage(0);
            setCooldownStage(1);
            if(isFullReset) {
                 const repsForWorkout = Array(workout.exercises.length).fill(0).map(() => Array(workout.rounds).fill(null));
                 setSessionReps(repsForWorkout);
            }
            ProgressService.clearInProgress(uid);
        }
        // Always start paused, requiring user interaction to play
        setRunning(false); 
    };
    
    useEffect(() => {
        resetWorkoutState(false);
    }, [workout.id]); // Reset when workout changes

    // Main timer tick effect
    useEffect(() => {
        if (!running) {
            return;
        }

        const interval = setInterval(() => {
            setSeconds(s => {
                const newSeconds = s - 1;
                
                 if (settings.audioCues) {
                    // Mid-interval beep for 30s warmup sets to indicate side change
                    if (phase === 'warmup' && warmupStage > 0 && newSeconds === 15) {
                        playSound(0.15, 660);
                        setTimeout(() => playSound(0.15, 660), 200);
                    }

                    // End of interval countdown
                    if (phase === 'work' || phase === 'rest' || phase === 'warmup' || phase === 'cooldown' || phase === 'warmup_rest' || phase.startsWith('getready')) {
                        if (newSeconds === 2) { // 3 seconds left
                            playSound(0.2, 880);
                        } else if (newSeconds === 1) { // 2 seconds left
                            playSound(0.2, 880);
                        } else if (newSeconds === 0) { // 1 second left
                            playSound(0.5, 440);
                        }
                    }
                }

                if (newSeconds > 0) {
                    return newSeconds;
                }

                // --- Timer expired, advance to next phase ---
                
                // Warmup Logic
                if (phase === 'getready') {
                    setPhase('warmup');
                    const isSpecialPreWarmup = workout.preWarmUp.name === 'Standing March' || workout.preWarmUp.name === 'Jumping Jacks';
                    const preWarmupDuration = isSpecialPreWarmup ? 55 : 30;
                    setSeconds(preWarmupDuration);
                    setWarmupStage(0); // Start with pre-warmup stage
                    return preWarmupDuration;
                }
                if (phase === 'warmup') {
                    setPhase('warmup_rest');
                    setSeconds(5);
                    return 5;
                }
                if (phase === 'warmup_rest') {
                    const nextWarmupStage = warmupStage + 1;
                    if (nextWarmupStage >= TOTAL_WARMUP_STAGES) { // e.g. 7 stages (0-6)
                        setPhase('getready_work');
                        setSeconds(GET_READY_DURATION);
                        return GET_READY_DURATION;
                    }
                    setWarmupStage(nextWarmupStage);
                    setPhase('warmup');
                    setSeconds(30); // All subsequent warmups are 30s
                    return 30;
                }

                // Main Workout Logic
                if (phase === 'getready_work') {
                    setPhase('work');
                    setSeconds(workout.work);
                    return workout.work;
                }
                if (phase === 'work') {
                     if (settings.trackReps) {
                        onNumpadOpen(exerciseIndex);
                        if (settings.pauseOnRepCount) {
                            setRunning(false);
                        }
                    }

                    if (workout.rest > 0) {
                        setPhase('rest');
                        setSeconds(workout.rest);
                        return workout.rest;
                    }
                    // No rest, fall through to next exercise
                }
                
                // Transition from WORK (if no rest) or REST
                if (phase === 'work' || phase === 'rest') {
                    const nextExerciseIndex = exerciseIndex + 1;
                    if (nextExerciseIndex < workout.exercises.length) {
                        setExerciseIndex(nextExerciseIndex);
                        setPhase('work');
                        setSeconds(workout.work);
                        return workout.work;
                    }
                    
                    const nextRound = round + 1;
                    if (nextRound <= workout.rounds) {
                        setRound(nextRound);
                        setExerciseIndex(0);
                        setPhase('work');
                        setSeconds(workout.work);
                        return workout.work;
                    }
                    
                    // All rounds done
                    if (settings.enableCooldown) {
                        setPhase('getready_cooldown');
                        setSeconds(GET_READY_DURATION);
                        return GET_READY_DURATION;
                    } else {
                        setPhase('done');
                        onFinish();
                        return 0;
                    }
                }
                
                // Cooldown Logic
                if (phase === 'getready_cooldown') {
                    setPhase('cooldown');
                    setSeconds(30);
                    setCooldownStage(1);
                    return 30;
                }
                if (phase === 'cooldown') {
                    const nextCooldownStage = cooldownStage + 1;
                    if (nextCooldownStage > COOLDOWN_ROUNDS) { 
                        setPhase('done');
                        onFinish();
                        return 0;
                    }
                    setCooldownStage(nextCooldownStage);
                    setSeconds(30);
                    return 30;
                }

                return 0; // Should not be reached
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [running, phase, round, exerciseIndex, workout, warmupStage, cooldownStage, onFinish, settings, playSound]);


    // Save snapshot on state change
    useEffect(() => {
        if (phase !== 'done') {
            const snap: TimerSnapshot = {
                workoutId: workout.id,
                phase,
                round,
                exerciseIndex,
                seconds,
                sessionReps,
                warmupStage,
                cooldownStage,
            };
            snapshotRef.current = snap;
             ProgressService.markInProgress(workout.id, snap);
        }
    }, [workout.id, phase, round, exerciseIndex, seconds, sessionReps, warmupStage, cooldownStage]);


    // Determine what to display
    const { displayExercise, nextUpExercise, headerTitle, canGoPrev } = useMemo(() => {
        let displayExercise: Exercise = workout.exercises[0];
        let nextUpExercise: Exercise | null = null;
        let headerTitle = "Work";

        let canGoPrev = true;
        if (settings.enableWarmup) {
            if (phase === 'getready' || (phase === 'warmup' && warmupStage === 0)) {
                canGoPrev = false;
            }
        } else { // Warmup is disabled
            if (phase === 'getready_work' || (phase === 'work' && round === 1 && exerciseIndex === 0)) {
                canGoPrev = false;
            }
        }

        switch (phase) {
            case 'getready':
                displayExercise = workout.preWarmUp;
                headerTitle = "Get Ready";
                break;
            case 'warmup':
            case 'warmup_rest':
                 if (warmupStage === 0) {
                     displayExercise = workout.preWarmUp;
                     nextUpExercise = workout.warmUpExercises[0];
                 } else {
                     const exerciseIdx = (warmupStage - 1) % workout.warmUpExercises.length;
                     displayExercise = workout.warmUpExercises[exerciseIdx];
                     const nextWarmupStage = warmupStage + 1;
                     if (nextWarmupStage >= TOTAL_WARMUP_STAGES) {
                        nextUpExercise = workout.exercises[0];
                     } else {
                        const nextExerciseIdx = (nextWarmupStage - 1) % workout.warmUpExercises.length;
                        nextUpExercise = workout.warmUpExercises[nextExerciseIdx];
                     }
                 }
                 headerTitle = phase === 'warmup_rest' ? "Rest" : "Work";
                break;
            case 'getready_work':
                displayExercise = workout.exercises[0];
                headerTitle = "Get Ready";
                break;
            case 'work':
            case 'rest':
                displayExercise = workout.exercises[exerciseIndex];
                headerTitle = phase === 'rest' ? "Rest" : "Work";
                const nextExIdx = exerciseIndex + 1;
                if (nextExIdx < workout.exercises.length) {
                    nextUpExercise = workout.exercises[nextExIdx];
                } else if (round < workout.rounds) {
                    nextUpExercise = workout.exercises[0];
                } else {
                    nextUpExercise = workout.coolDown;
                }
                break;
             case 'getready_cooldown':
                displayExercise = workout.coolDown;
                headerTitle = "Get Ready";
                break;
            case 'cooldown':
                displayExercise = workout.coolDown;
                headerTitle = "Work";
                break;
            case 'done':
                displayExercise = workout.exercises[workout.exercises.length - 1];
                headerTitle = "Done!";
                break;
        }

        return { displayExercise, nextUpExercise, headerTitle, canGoPrev };
    }, [phase, exerciseIndex, round, warmupStage, cooldownStage, workout, settings.enableWarmup]);


    const togglePlayPause = useCallback(() => {
        setRunning(r => !r);
    }, []);

    const changeExercise = useCallback((direction: 1 | -1) => {
        setRunning(false);
    
        // --- FORWARD ---
        if (direction === 1) {
            // From warmup phases
            if (phase === 'getready' || phase.startsWith('warmup')) {
                const nextWarmupStage = warmupStage + 1;
                if (nextWarmupStage >= TOTAL_WARMUP_STAGES) { // Done with warmup
                    setPhase('getready_work');
                    setSeconds(GET_READY_DURATION);
                    setRound(1);
                    setExerciseIndex(0);
                } else { // Next warmup step
                    setPhase('warmup');
                    setSeconds(30);
                    setWarmupStage(nextWarmupStage);
                }
                return;
            }
    
            // From main work phases
            if (phase === 'getready_work' || phase === 'work' || phase === 'rest') {
                let nextRound = round;
                let nextExIndex = exerciseIndex + 1;
                if (nextExIndex >= workout.exercises.length) {
                    nextExIndex = 0;
                    nextRound++;
                }
                if (nextRound > workout.rounds) { // Done with main work
                    if (settings.enableCooldown) {
                        setPhase('getready_cooldown');
                        setSeconds(GET_READY_DURATION);
                        setCooldownStage(1); // Start at 1
                    } else {
                        setPhase('done'); onFinish();
                    }
                } else { // Next main exercise
                    setPhase('work');
                    setSeconds(workout.work);
                    setRound(nextRound);
                    setExerciseIndex(nextExIndex);
                }
                return;
            }
            
            // From cooldown phases
            if (phase === 'getready_cooldown' || phase === 'cooldown') {
                const nextCooldownStage = cooldownStage + 1;
                if (nextCooldownStage > COOLDOWN_ROUNDS) { // Done with cooldown
                    setPhase('done'); onFinish();
                } else { // Next cooldown step
                    setPhase('cooldown');
                    setSeconds(30);
                    setCooldownStage(nextCooldownStage);
                }
                return;
            }
        }
    
        // --- BACKWARD ---
        if (direction === -1) {
            // From cooldown phases
            if (phase === 'getready_cooldown' || phase === 'cooldown') {
                const prevCooldownStage = cooldownStage - 1;
                if (prevCooldownStage < 1) { // Go back to main work
                    setPhase('work');
                    setSeconds(workout.work);
                    setRound(workout.rounds);
                    setExerciseIndex(workout.exercises.length - 1);
                } else { // Prev cooldown step
                    setPhase('cooldown');
                    setSeconds(30);
                    setCooldownStage(prevCooldownStage);
                }
                return;
            }
            
            // From main work phases
            if (phase === 'getready_work' || phase === 'work' || phase === 'rest') {
                let prevRound = round;
                let prevExIndex = exerciseIndex - 1;
                if (prevExIndex < 0) {
                    prevExIndex = workout.exercises.length - 1;
                    prevRound--;
                }
                if (prevRound < 1) { // Go back to warmup
                    if (settings.enableWarmup) {
                        setPhase('warmup');
                        setWarmupStage(TOTAL_WARMUP_STAGES - 1); // Last stage of warmup
                        setSeconds(30);
                    }
                } else { // Prev main exercise
                    setPhase('work');
                    setSeconds(workout.work);
                    setRound(prevRound);
                    setExerciseIndex(prevExIndex);
                }
                return;
            }
    
            // From warmup phases
            if (phase.startsWith('warmup')) {
                const prevWarmupStage = warmupStage - 1;
                if (prevWarmupStage >= 0) {
                    setPhase('warmup');
                    setSeconds(30);
                    setWarmupStage(prevWarmupStage);
                }
                return;
            }
        }
    }, [phase, round, exerciseIndex, warmupStage, cooldownStage, workout, settings, onFinish]);
    

    return {
        phase,
        seconds,
        running,
        round,
        exerciseIndex,
        warmupStage,
        cooldownStage,
        headerTitle,
        displayExercise,
        nextUpExercise,
        canGoPrev,
        setRunning,
        togglePlayPause,
        changeExercise,
        resetWorkoutState,
    };
};