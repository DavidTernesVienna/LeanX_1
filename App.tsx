
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
import { SettingsScreen } from './components/SettingsScreen';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { UserIcon, BookIcon, BackArrowIcon, HomeIcon, SettingsIcon } from './components/icons';

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
        } else if (view === 'profile' || view === 'tutorial' || view === 'chooseCycle' || view === 'settings') {
            setView('home');
        } else {
            setView('home');
        }
    };

    const handleSaveAndExitWorkout = () => {
        setView('home');
    };

    const BottomNavBar = () => {
        const navItems = [
            { view: 'home', icon: HomeIcon, label: 'Home' },
            { view: 'tutorial', icon: BookIcon, label: 'Library' },
            { view: 'profile', icon: UserIcon, label: 'Profile' },
            { view: 'settings', icon: SettingsIcon, label: 'Settings' },
        ];

        return (
            <footer className="fixed bottom-0 left-0 right-0 bg-gray-dark border-t border-gray-light/50 z-20">
                <nav className="flex justify-around items-center h-16">
                    {navItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view as AppView)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                                view === item.view ? 'text-accent' : 'text-gray-text'
                            }`}
                            aria-label={item.label}
                        >
                            <item.icon className="w-7 h-7" />
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </footer>
        );
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
                />;
            case 'tutorial':
                return <TutorialScreen
                    onSelectExercise={setModalExercise}
                    onBack={handleBack}
                />
            case 'settings':
                return <SettingsScreen
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onBack={handleBack}
                />;
            case 'chooseCycle':
                return (
                    <div className="min-h-screen flex flex-col p-4">
                        <header className="flex items-center mb-6">
                            <button onClick={handleBack} className="p-2 -ml-2">
                                <BackArrowIcon className="w-6 h-6" />
                            </button>
                            <h1 className="font-semibold text-xl mx-auto">Choose Workout</h1>
                            <div className="w-6 h-6"></div>
                        </header>
                        <main className="flex-grow overflow-y-auto">
                            <History
                                workouts={workouts}
                                progress={progress}
                                onSelectWorkout={(index) => {
                                    handleSelectWorkout(index);
                                    setView('home');
                                }}
                                onUpdateProgress={handleUpdateProgress}
                                selectedWorkoutIndex={selectedWorkoutIndex}
                            />
                        </main>
                    </div>
                );
            case 'home':
            default:
                const uid = selectedWorkout
                    ? ProgressService.getWorkoutUID(selectedWorkout)
                    : null;
                const lastResult = uid ? progress[uid] : undefined;

                return (
                    <div className="p-4 space-y-4">
                        <div className="flex justify-center items-center">
                            <h1 className="text-4xl font-bold">LeanX</h1>
                        </div>

                        {selectedWorkout && (
                            <PreviewScreen
                                workout={selectedWorkout}
                                onStart={handleStartWorkout}
                                lastResult={lastResult}
                            />
                        )}
                        
                        <div className="bg-gray-dark rounded-xl p-4">
                            <button 
                                onClick={() => setView('chooseCycle')} 
                                className="w-full bg-gray-light text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
                            >
                                Choose Workout
                            </button>
                        </div>
                    </div>
                );
        }
    };

    const showNavBar = ['home', 'chooseCycle', 'tutorial', 'profile', 'settings'].includes(view);

    return (
        <main className={`min-h-screen ${showNavBar ? 'pb-24' : ''}`}>
            {renderView()}
            {modalExercise && (
                <ExerciseDetailModal 
                    exercise={modalExercise}
                    onClose={() => setModalExercise(null)}
                />
            )}
            {showNavBar && <BottomNavBar />}
        </main>
    );
};

export default App;
