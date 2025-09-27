

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BUILT_IN_DATA } from './constants';
import * as ProgressService from './services/progressService';
import type { Workout, Progress, AppView, Profile, Settings, ProgressItem, Exercise } from './types';
import { History } from './components/History';
import { PreviewScreen } from './components/PreviewScreen';
import { WorkoutScreen } from './components/WorkoutScreen';
import { FinishedScreen } from './components/FinishedScreen';
import { RepTrackingScreen } from './components/RepTrackingScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { TutorialScreen } from './components/TutorialScreen';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { UserIcon, BookIcon } from './components/icons';

const App: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>(BUILT_IN_DATA);
    const [progress, setProgress] = useState<Progress>(() => ProgressService.loadProgress());
    const [profile, setProfile] = useState<Profile | null>(() => ProgressService.loadProfile());
    const [settings, setSettings] = useState<Settings>(() => ProgressService.loadSettings());
    const [sessionReps, setSessionReps] = useState<(number | null)[]>([]);
    const [view, setView] = useState<AppView>('home');
    const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);
    const [modalExercise, setModalExercise] = useState<Exercise | null>(null);
    const isInitialLoad = useRef(true);

    const selectedWorkout = selectedWorkoutIndex !== null ? workouts[selectedWorkoutIndex] : null;

    useEffect(() => {
        if (!isInitialLoad.current || workouts.length === 0) return;
        
        isInitialLoad.current = false;

        let resumeWorkoutIndex = -1;
        const progressWithKeys = Object.entries(progress);
        // FIX: Cast `p` to `ProgressItem` to access its properties, as `Object.entries` may return `[string, unknown]`.
        const inProgressEntry = progressWithKeys.find(([,p]) => (p as ProgressItem).inProgress && (p as ProgressItem).snap);

        if (inProgressEntry) {
            // FIX: Cast `inProgressEntry[1]` to `ProgressItem` to access its properties.
            const workoutIdToResume = (inProgressEntry[1] as ProgressItem).snap?.workoutId;
            if (workoutIdToResume) {
                const foundIndex = workouts.findIndex(w => w.id === workoutIdToResume);
                if (foundIndex !== -1) {
                    resumeWorkoutIndex = foundIndex;
                } else {
                    console.warn(`Workout to resume (id: ${workoutIdToResume}) not found. Clearing state.`);
                    ProgressService.clearInProgress(inProgressEntry[0]);
                }
            }
        }
        
        if (resumeWorkoutIndex !== -1) {
            setSelectedWorkoutIndex(resumeWorkoutIndex);
            setView('workout');
        } else {
            const firstNotDone = workouts.findIndex((w) => !progress[ProgressService.getWorkoutUID(w)]?.done);
            setSelectedWorkoutIndex(firstNotDone >= 0 ? firstNotDone : 0);
            setView('home');
        }
    }, [workouts, progress]);

    const handleSelectWorkout = useCallback((index: number) => {
        setSelectedWorkoutIndex(index);
    }, []);
    
    const handleUpdateProgress = (newProgress: Progress) => {
        setProgress(newProgress);
    };
    
    const handleStartWorkout = () => {
        if (selectedWorkout) {
            setSessionReps(Array(selectedWorkout.exercises.length).fill(null));
            setView('workout');
        }
    };

    const handleWorkoutFinish = useCallback(() => {
        if (selectedWorkout) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.markDone(uid);
            setProgress(newProgress);
        }
        setView('finished');
    }, [selectedWorkout]);

    const handleLogReps = () => {
        setView('repTracking');
    };

    const handleReturnToHomeWithNextWorkout = () => {
        if (selectedWorkoutIndex !== null) {
            const nextIndex = (selectedWorkoutIndex + 1) % workouts.length;
            setSelectedWorkoutIndex(nextIndex);
        } else {
            // Fallback if index is somehow lost: find first not done.
            const firstNotDone = workouts.findIndex((w) => !progress[ProgressService.getWorkoutUID(w)]?.done);
            setSelectedWorkoutIndex(firstNotDone >= 0 ? firstNotDone : 0);
        }
        setView('home');
    };

    const handleContinueFromFinish = () => {
        handleReturnToHomeWithNextWorkout();
    };

    const handleSaveReps = (reps: number[]) => {
        if (selectedWorkout) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.saveRepsForWorkout(uid, reps);
            setProgress(newProgress);
        }
        handleReturnToHomeWithNextWorkout();
    };
    
    const handleSaveProfile = (name: string) => {
        const newProfile = { name };
        ProgressService.saveProfile(newProfile);
        setProfile(newProfile);
    };

    const handleUpdateSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        ProgressService.saveSettings(newSettings);
    };

    const handleBack = () => {
        if (view === 'workout' && selectedWorkout) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.clearInProgress(uid);
            setProgress(newProgress);
            setView('home');
        } else if (view === 'repTracking') {
             setView('finished');
        } else if (view === 'profile' || view === 'tutorial') {
            setView('home');
        } else {
            setView('home');
        }
    };

    const handleSaveAndExitWorkout = () => {
        setView('home');
    };

    const renderView = () => {
        switch (view) {
            case 'workout':
                if (selectedWorkout) {
                    return <WorkoutScreen 
                        workout={selectedWorkout} 
                        settings={settings}
                        onUpdateSettings={handleUpdateSettings}
                        sessionReps={sessionReps}
                        setSessionReps={setSessionReps}
                        onBack={handleBack} 
                        onFinish={handleWorkoutFinish}
                        onShowExerciseInfo={setModalExercise}
                        onSaveAndExit={handleSaveAndExitWorkout}
                    />;
                }
                return null;
            case 'finished':
                return <FinishedScreen onLogReps={handleLogReps} onContinue={handleContinueFromFinish} />;
            case 'repTracking':
                if (selectedWorkout) {
                    return <RepTrackingScreen 
                        workout={selectedWorkout} 
                        onSaveReps={handleSaveReps} 
                        onBack={handleBack} 
                        initialReps={sessionReps}
                    />;
                }
                return null;
            case 'profile':
                return <ProfileScreen 
                    profile={profile} 
                    progress={progress} 
                    workouts={workouts} 
                    onSaveProfile={handleSaveProfile} 
                    onBack={handleBack} 
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                />;
            case 'tutorial':
                return <TutorialScreen
                    onSelectExercise={setModalExercise}
                    onBack={handleBack}
                />
            case 'home':
            default:
                const uid = selectedWorkout
                    ? ProgressService.getWorkoutUID(selectedWorkout)
                    : null;
                const lastResult = uid ? progress[uid] : undefined;

                return (
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">Lean Interval Timer</h1>
                             <div className="flex items-center">
                                <button onClick={() => setView('tutorial')} className="p-2 text-gray-text hover:text-off-white transition-colors">
                                    <BookIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => setView('profile')} className="p-2 -mr-2 text-gray-text hover:text-off-white transition-colors">
                                    <UserIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {selectedWorkout && (
                            <PreviewScreen
                                workout={selectedWorkout}
                                onStart={handleStartWorkout}
                                lastResult={lastResult}
                            />
                        )}
                        
                        <History
                            workouts={workouts}
                            progress={progress}
                            onSelectWorkout={handleSelectWorkout}
                            onUpdateProgress={handleUpdateProgress}
                            selectedWorkoutIndex={selectedWorkoutIndex}
                        />
                    </div>
                );
        }
    };

    return (
        <main className="min-h-screen">
            {renderView()}
            {modalExercise && (
                <ExerciseDetailModal 
                    exercise={modalExercise}
                    onClose={() => setModalExercise(null)}
                />
            )}
        </main>
    );
};

export default App;