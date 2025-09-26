
import React, { useState, useEffect, useCallback } from 'react';
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

    const selectedWorkout = selectedWorkoutIndex !== null ? workouts[selectedWorkoutIndex] : null;

    useEffect(() => {
        // On initial load, find the first not-done workout and set it as the default selection.
        const resumeSnap = ProgressService.loadResume();
        if (resumeSnap) {
            setSelectedWorkoutIndex(resumeSnap.idxWorkout);
        } else {
            const firstNotDone = workouts.findIndex((w, i) => !progress[ProgressService.getWorkoutUID(w, i)]?.done);
            setSelectedWorkoutIndex(firstNotDone >= 0 ? firstNotDone : 0);
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
        if (selectedWorkout && selectedWorkoutIndex !== null) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout, selectedWorkoutIndex);
            const newProgress = ProgressService.markDone(uid);
            setProgress(newProgress);
        }
        setView('finished');
    }, [selectedWorkout, selectedWorkoutIndex]);

    const handleLogReps = () => {
        setView('repTracking');
    };

    const handleContinueFromFinish = () => {
        const firstNotDone = workouts.findIndex((w, i) => !progress[ProgressService.getWorkoutUID(w, i)]?.done);
        setSelectedWorkoutIndex(firstNotDone >= 0 ? firstNotDone : 0);
        setView('home');
    };

    const handleSaveReps = (reps: number[]) => {
        if (selectedWorkout && selectedWorkoutIndex !== null) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout, selectedWorkoutIndex);
            const newProgress = ProgressService.saveRepsForWorkout(uid, reps);
            setProgress(newProgress);
        }
        const firstNotDone = workouts.findIndex((w, i) => !progress[ProgressService.getWorkoutUID(w, i)]?.done);
        setSelectedWorkoutIndex(firstNotDone >= 0 ? firstNotDone : 0);
        setView('home');
    };
    
    const handleSaveProfile = (name: string) => {
        const newProfile = { name };
        ProgressService.saveProfile(newProfile);
        setProfile(newProfile);
    };

    const handleBack = () => {
        if (view === 'workout') setView('home');
        else if (view === 'repTracking') setView('finished');
        else if (view === 'profile') setView('home');
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
                const uid = selectedWorkout && selectedWorkoutIndex !== null 
                    ? ProgressService.getWorkoutUID(selectedWorkout, selectedWorkoutIndex) 
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