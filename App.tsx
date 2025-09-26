
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BUILT_IN_DATA } from './constants';
import * as ProgressService from './services/progressService';
import type { Workout, Progress, AppView, Profile } from './types';
import { History } from './components/History';
import { PreviewScreen } from './components/PreviewScreen';
import { WorkoutScreen } from './components/WorkoutScreen';
import { FinishedScreen } from './components/FinishedScreen';
import { RepTrackingScreen } from './components/RepTrackingScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { UserIcon } from './components/icons';

const App: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>(BUILT_IN_DATA);
    const [progress, setProgress] = useState<Progress>(() => ProgressService.loadProgress());
    const [profile, setProfile] = useState<Profile | null>(() => ProgressService.loadProfile());
    const [view, setView] = useState<AppView>('home');
    const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);
    const isInitialLoad = useRef(true);

    const selectedWorkout = selectedWorkoutIndex !== null ? workouts[selectedWorkoutIndex] : null;

    useEffect(() => {
        if (!isInitialLoad.current || workouts.length === 0) return;
        
        isInitialLoad.current = false;

        let resumeWorkoutIndex = -1;
        const progressWithKeys = Object.entries(progress);
        const inProgressEntry = progressWithKeys.find(([,p]) => p.inProgress && p.snap);

        if (inProgressEntry) {
            const workoutIdToResume = inProgressEntry[1].snap?.workoutId;
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

    const handleBack = () => {
        if (view === 'workout' && selectedWorkout) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.clearInProgress(uid);
            setProgress(newProgress);
            setView('home');
        } else if (view === 'repTracking') {
             setView('finished');
        } else if (view === 'profile') {
            setView('home');
        } else {
            setView('home');
        }
    };

    const renderView = () => {
        switch (view) {
            case 'workout':
                if (selectedWorkout && selectedWorkoutIndex !== null) {
                    return <WorkoutScreen workout={selectedWorkout} workoutIndex={selectedWorkoutIndex} onBack={handleBack} onFinish={handleWorkoutFinish} />;
                }
                return null;
            case 'finished':
                return <FinishedScreen onLogReps={handleLogReps} onContinue={handleContinueFromFinish} />;
            case 'repTracking':
                if (selectedWorkout) {
                    return <RepTrackingScreen workout={selectedWorkout} onSaveReps={handleSaveReps} onBack={handleBack} />;
                }
                return null;
            case 'profile':
                return <ProfileScreen 
                    profile={profile} 
                    progress={progress} 
                    workouts={workouts} 
                    onSaveProfile={handleSaveProfile} 
                    onBack={handleBack} 
                />;
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
                            <button onClick={() => setView('profile')} className="p-2 -mr-2 text-gray-text hover:text-off-white transition-colors">
                                <UserIcon className="w-6 h-6" />
                            </button>
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
        </main>
    );
};

export default App;