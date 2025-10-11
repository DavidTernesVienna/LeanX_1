
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
import { CameraView } from './components/CameraView';
import { ImageCropper } from './components/ImageCropper';

const App: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>(BUILT_IN_DATA);
    const [progress, setProgress] = useState<Progress>(() => ProgressService.loadProgress());
    const [profile, setProfile] = useState<Profile | null>(() => ProgressService.loadProfile());
    const [settings, setSettings] = useState<Settings>(() => ProgressService.loadSettings());
    const [sessionReps, setSessionReps] = useState<(number | null)[][]>([]);
    const [view, setView] = useState<AppView>(() => ProgressService.loadProfile() ? 'home' : 'welcome');
    const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);
    const [modalExercise, setModalExercise] = useState<Exercise | null>(null);
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [returnToView, setReturnToView] = useState<AppView>('home');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialLoad = useRef(true);
    const [isWakeLockSupported, setIsWakeLockSupported] = useState(true);

    const selectedWorkout = selectedWorkoutIndex !== null ? workouts[selectedWorkoutIndex] : null;

    useEffect(() => {
        const checkWakeLockSupport = async () => {
            let supported = false;
            if ('wakeLock' in navigator && 'permissions' in navigator) {
                try {
                    const status = await navigator.permissions.query({ name: 'screen-wake-lock' as any });
                    if (status.state !== 'denied') {
                        supported = true;
                    }
                } catch (e) {
                    console.warn('Could not query screen-wake-lock permission, assuming not supported.', e);
                    supported = false;
                }
            } else {
                supported = false;
            }
            
            setIsWakeLockSupported(supported);
            
            if (!supported) {
                setSettings(currentSettings => {
                    if (currentSettings.enableWakeLock) {
                        const newSettings = { ...currentSettings, enableWakeLock: false };
                        ProgressService.saveSettings(newSettings);
                        return newSettings;
                    }
                    return currentSettings;
                });
            }
        };
        checkWakeLockSupport();
    }, []);

    useEffect(() => {
        if (!ProgressService.loadProfile()) return;

        if (!isInitialLoad.current || workouts.length === 0) return;
        
        isInitialLoad.current = false;

        let resumeWorkoutIndex = -1;
        const progressWithKeys = Object.entries(progress);
        const inProgressEntry = progressWithKeys.find(([,p]) => (p as ProgressItem).inProgress && (p as ProgressItem).snap);

        if (inProgressEntry) {
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
            const repsForWorkout = Array(selectedWorkout.exercises.length).fill(0).map(() => Array(selectedWorkout.rounds).fill(null));
            setSessionReps(repsForWorkout);
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
    
    const handleImageSelected = (dataUrl: string) => {
        setImageToCrop(dataUrl);
        setView('imageCropper');
    };

    const handleCropComplete = (croppedDataUrl: string | null) => {
        if (croppedDataUrl) {
            if (returnToView === 'profile' && profile) {
                const updatedProfile = { ...profile, picture: croppedDataUrl };
                setProfile(updatedProfile);
                ProgressService.saveProfile(updatedProfile);
            } else {
                setNewProfilePicture(croppedDataUrl);
            }
        }
        setView(returnToView);
        setImageToCrop(null);
    };

    const handleCreateProfile = () => {
        if (newProfileName.trim()) {
            const newProfile: Profile = { 
                name: newProfileName.trim(),
                ...(newProfilePicture && { picture: newProfilePicture })
            };
            ProgressService.saveProfile(newProfile);
            setProfile(newProfile);
            setView('getStarted');
        }
    };
    
    const handleUpdateProfile = (updatedProfile: Profile) => {
        setProfile(updatedProfile);
        ProgressService.saveProfile(updatedProfile);
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
        } else if (['profile', 'tutorial', 'chooseCycle', 'settings', 'camera', 'imageCropper'].includes(view)) {
            setView(view === 'camera' || view === 'imageCropper' ? returnToView : 'home');
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
            case 'welcome':
                return (
                    <div className="min-h-screen flex flex-col p-4 text-center">
                        <header className="py-4">
                            <h1 className="text-4xl font-bold">LeanX</h1>
                        </header>
                        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
                            <p className="text-gray-text">Set up your profile to get started.</p>
                            
                            <div className="relative w-full max-w-xs aspect-square rounded-2xl bg-gray-dark flex items-center justify-center mb-4">
                                {newProfilePicture ? (
                                    <img src={newProfilePicture} alt="Profile preview" className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    <UserIcon className="w-20 h-20 text-gray-light" />
                                )}
                            </div>

                            <div className="flex gap-4 w-full max-w-xs">
                                <button
                                    onClick={() => { setReturnToView('welcome'); setView('camera'); }}
                                    className="flex-1 bg-gray-light text-off-white font-semibold py-2 px-4 rounded-xl text-sm"
                                >
                                    Take Photo
                                </button>
                                <button
                                    onClick={() => { setReturnToView('welcome'); fileInputRef.current?.click(); }}
                                    className="flex-1 bg-gray-light text-off-white font-semibold py-2 px-4 rounded-xl text-sm"
                                >
                                    From Gallery
                                </button>
                            </div>
                           
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateProfile()}
                                className="w-full max-w-xs bg-gray-dark text-off-white text-center p-3 rounded-md border border-gray-light"
                            />
                            <button
                                onClick={handleCreateProfile}
                                className="w-full max-w-xs bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
                            >
                                Set Profile
                            </button>
                        </main>
                    </div>
                );
            case 'getStarted':
                return (
                    <div className="min-h-screen flex flex-col p-4 text-center">
                        <header className="py-4 flex justify-center items-center">
                            <h1 className="text-4xl font-bold">LeanX</h1>
                        </header>
                        <main className="flex-grow flex flex-col items-center justify-center space-y-8">
                            {profile?.picture && (
                                <img src={profile.picture} alt="Profile" className="w-32 h-32 rounded-2xl object-cover border-4 border-accent" />
                            )}
                            <p className="text-3xl text-off-white">
                                Let's get started, <span className="font-bold text-accent">{profile?.name}</span>!
                            </p>
                            <button
                                onClick={() => setView('chooseCycle')}
                                className="w-full max-w-xs bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
                            >
                                Choose Workout
                            </button>
                        </main>
                    </div>
                );
            case 'camera':
                return (
                    <CameraView 
                        onPictureTaken={handleImageSelected} 
                        onCancel={() => setView(returnToView)} 
                    />
                );
            case 'imageCropper':
                if (imageToCrop) {
                    return <ImageCropper 
                        src={imageToCrop} 
                        onComplete={handleCropComplete} 
                        onCancel={() => {
                            setView(returnToView);
                            setImageToCrop(null);
                        }} 
                    />
                }
                setView(returnToView);
                return null;
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
                        isWakeLockSupported={isWakeLockSupported}
                    />;
                }
                return null;
            case 'finished':
                return <FinishedScreen onLogReps={handleLogReps} onContinue={handleContinueFromFinish} />;
            case 'repTracking':
                if (selectedWorkout) {
                    const summedReps = sessionReps.map(exerciseReps => 
                        exerciseReps.reduce((acc, rep) => acc + (rep || 0), 0)
                    );
                    return <RepTrackingScreen 
                        workout={selectedWorkout} 
                        onSaveReps={handleSaveReps} 
                        onBack={handleBack} 
                        initialReps={summedReps}
                    />;
                }
                return null;
            case 'profile':
                 if (profile) {
                    return <ProfileScreen 
                        profile={profile} 
                        progress={progress} 
                        workouts={workouts} 
                        onUpdateProfile={handleUpdateProfile}
                        onBack={handleBack}
                        onTakePhoto={() => {
                            setReturnToView('profile');
                            setView('camera');
                        }}
                        onChooseFromGallery={() => {
                            setReturnToView('profile');
                            fileInputRef.current?.click();
                        }}
                    />;
                 }
                 setView('welcome'); // Fallback if profile is somehow null
                 return null;
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
                    isWakeLockSupported={isWakeLockSupported}
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
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = document.createElement('img');
                            img.onload = () => {
                                const MAX_DIMENSION = 800;
                                let { width, height } = img;
                        
                                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                                    if (width > height) {
                                        height = Math.round((height * MAX_DIMENSION) / width);
                                        width = MAX_DIMENSION;
                                    } else {
                                        width = Math.round((width * MAX_DIMENSION) / height);
                                        height = MAX_DIMENSION;
                                    }
                                }
                                
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                                    handleImageSelected(dataUrl);
                                }
                            };
                            img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                    }
                    // Reset file input value to allow selecting the same file again
                    e.target.value = '';
                }}
                accept="image/*"
                className="hidden"
            />
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
