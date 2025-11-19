
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BUILT_IN_DATA, WORKOUT_NAMES, CRAWLING_WARMUP_NAMES, SIDELYING_WARMUP_NAMES } from './constants';
import * as ProgressService from './services/progressService';
import { getImageForExercise } from './services/exerciseImageService';
import { parseTiming, assertWorkout } from './timing';
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
import { ExerciseEditorScreen } from './components/ExerciseEditorScreen';
import { VideoRecorder } from './components/VideoRecorder';
import { ThumbnailSelector } from './components/ThumbnailSelector';
import { OnboardingWizard } from './components/OnboardingWizard';


const generateVideoThumbnail = (videoSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous'; 

    const handleSeeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(thumbnailUrl);
      } else {
        cleanup();
        reject(new Error('Could not get 2d context from canvas.'));
      }
    };

    const handleLoadedData = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Failed to load video for thumbnail generation.'));
    };
    
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      video.remove();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    setTimeout(() => {
        if (video.readyState >= 2) { 
            handleLoadedData();
        }
    }, 200);
  });
};


const App: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [progress, setProgress] = useState<Progress>(() => ProgressService.loadProgress());
    const [profile, setProfile] = useState<Profile | null>(() => ProgressService.loadProfile());
    const [settings, setSettings] = useState<Settings>(() => ProgressService.loadSettings());
    const [customExercises, setCustomExercises] = useState<Exercise[]>(() => ProgressService.loadCustomExercises());
    const [sessionReps, setSessionReps] = useState<(number | null)[][]>([]);
    const [view, setView] = useState<AppView>(() => ProgressService.loadProfile() ? 'home' : 'onboarding');
    const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);
    const [modalExercise, setModalExercise] = useState<Exercise | null>(null);
    // Temporary state for onboarding profile creation
    const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);
    
    // Gamification State for Finish Screen
    const [lastEarnedXp, setLastEarnedXp] = useState(0);
    const [isLevelUpEvent, setIsLevelUpEvent] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);

    const [exerciseEditorData, setExerciseEditorData] = useState<Partial<Exercise>>({});
    const [originalExerciseNameForEdit, setOriginalExerciseNameForEdit] = useState<string | null>(null);
    
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [returnToView, setReturnToView] = useState<AppView>('home');
    const [videoForThumbnailSelection, setVideoForThumbnailSelection] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isInitialLoad = useRef(true);
    const [isWakeLockSupported, setIsWakeLockSupported] = useState(true);

    const selectedWorkout = selectedWorkoutIndex !== null ? workouts[selectedWorkoutIndex] : null;

    useEffect(() => {
        const checkWakeLockSupport = () => {
            const supported = 'wakeLock' in navigator;
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
        const customExercisesMap = new Map<string, Exercise>(customExercises.map(ex => [ex.name.toLowerCase(), ex] as [string, Exercise]));

        const createExerciseWithOverrides = (name: string): Exercise => {
            const custom = customExercisesMap.get(name.toLowerCase());
            if (custom) return custom;
            return {
                name,
                image: getImageForExercise(name),
                description: [
                    'Maintain a straight back and engaged core.',
                    'Focus on controlled, deliberate movements.',
                    'Breathe steadily throughout the exercise.'
                ]
            };
        };

        const dataWithOverrides = WORKOUT_NAMES.map(w => {
            const { work, rest, rounds } = parseTiming(w.timing, w.rounds);
            const id = `${w.cycle}|${w.week}|${w.day}|${w.timing}`.toLowerCase();
            
            return {
                cycle: w.cycle,
                week: w.week,
                day: w.day,
                timing: w.timing,
                id,
                work,
                rest,
                rounds,
                preWarmUp: createExerciseWithOverrides(w.preWarmUp),
                warmUp: createExerciseWithOverrides(w.warmUp),
                warmUpExercises: (w.warmUp === 'Crawling Warm Up' ? CRAWLING_WARMUP_NAMES : SIDELYING_WARMUP_NAMES).map(createExerciseWithOverrides),
                exercises: w.exercises.map(createExerciseWithOverrides),
                coolDown: createExerciseWithOverrides(w.coolDown),
            };
        }).filter(assertWorkout);

        setWorkouts(dataWithOverrides);
    }, [customExercises]);

    useEffect(() => {
        if (!ProgressService.loadProfile() || workouts.length === 0) return;

        if (!isInitialLoad.current) return;
        
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
            // Default selection behavior if no workout in progress
            // If profile exists, select based on their difficulty if not already set
            const p = ProgressService.loadProfile();
            if (p) {
                // Find the first not done workout
                const firstNotDone = workouts.findIndex((w) => !progress[ProgressService.getWorkoutUID(w)]?.done);
                
                // Or find the first workout of their difficulty level
                const firstOfLevel = workouts.findIndex(w => w.cycle === p.difficulty);
                
                if (firstNotDone >= 0) {
                     setSelectedWorkoutIndex(firstNotDone);
                } else if (firstOfLevel >= 0) {
                    setSelectedWorkoutIndex(firstOfLevel);
                } else {
                    setSelectedWorkoutIndex(0);
                }
            }
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
            // Mark Progress
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.markDone(uid);
            setProgress(newProgress);

            // Update Gamification Stats
            const statsUpdate = ProgressService.updateProfileStats(selectedWorkout);
            if (statsUpdate) {
                setProfile(statsUpdate.profile);
                setLastEarnedXp(statsUpdate.xpGained);
                setIsLevelUpEvent(statsUpdate.levelUp);
                setCurrentStreak(statsUpdate.profile.stats?.currentStreak || 0);
            }
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
        if (returnToView === 'exerciseEditor') {
            setExerciseEditorData(prev => ({ ...prev, image: dataUrl, video: undefined, youtubeId: undefined }));
            setView('exerciseEditor');
        } else {
            setImageToCrop(dataUrl);
            setView('imageCropper');
        }
    };
    
    const handleVideoSelected = async (videoDataUrl: string) => {
        try {
            const thumbnailUrl = await generateVideoThumbnail(videoDataUrl);
            setExerciseEditorData(prev => ({ ...prev, image: thumbnailUrl, video: videoDataUrl, youtubeId: undefined }));
        } catch (e) {
            console.error("Thumbnail generation failed:", e);
            setExerciseEditorData(prev => ({ ...prev, image: undefined, video: videoDataUrl, youtubeId: undefined }));
        }
        setView(returnToView);
    };

    const handleCropComplete = (croppedDataUrl: string | null) => {
        if (croppedDataUrl) {
            if (returnToView === 'profile' && profile) {
                const updatedProfile = { ...profile, picture: croppedDataUrl };
                setProfile(updatedProfile);
                ProgressService.saveProfile(updatedProfile);
            } else if (returnToView === 'onboarding') {
                 setNewProfilePicture(croppedDataUrl);
            }
        }
        setView(returnToView);
        setImageToCrop(null);
    };

    const handleCreateProfile = (newProfile: Profile) => {
        ProgressService.saveProfile(newProfile);
        setProfile(newProfile);
        
        // Auto-select the first workout of their chosen difficulty
        const firstWorkoutOfLevel = workouts.findIndex(w => w.cycle === newProfile.difficulty);
        if (firstWorkoutOfLevel >= 0) {
            setSelectedWorkoutIndex(firstWorkoutOfLevel);
        } else {
            setSelectedWorkoutIndex(0);
        }
        setView('home');
    };
    
    const handleUpdateProfile = (updatedProfile: Profile) => {
        setProfile(updatedProfile);
        ProgressService.saveProfile(updatedProfile);
    };

    const handleUpdateSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        ProgressService.saveSettings(newSettings);
    };

    const handleUpsertExercise = () => {
        const exercise: Exercise = {
            name: exerciseEditorData.name!,
            image: exerciseEditorData.image!,
            description: exerciseEditorData.description || [],
            video: exerciseEditorData.video,
            youtubeId: exerciseEditorData.youtubeId,
        };
        const newCustomExercises = ProgressService.addCustomExercise(exercise);
        setCustomExercises(newCustomExercises);
        setExerciseEditorData({});
        setOriginalExerciseNameForEdit(null);
        setView('tutorial');
    };

    const handleThumbnailSelected = (dataUrl: string) => {
        setExerciseEditorData(prev => ({ ...prev, image: dataUrl }));
        setVideoForThumbnailSelection(null);
        setView('exerciseEditor');
    };

    const handleBack = () => {
        if (view === 'workout' && selectedWorkout) {
            const uid = ProgressService.getWorkoutUID(selectedWorkout);
            const newProgress = ProgressService.clearInProgress(uid);
            setProgress(newProgress);
            setView('home');
        } else if (view === 'repTracking') {
             setView('finished');
        } else if (['profile', 'tutorial', 'chooseCycle', 'settings', 'camera', 'imageCropper', 'exerciseEditor', 'videoRecorder', 'thumbnailSelector'].includes(view)) {
             if (view === 'camera' || view === 'imageCropper' || view === 'videoRecorder') {
                setView(returnToView);
             } else if (view === 'exerciseEditor') {
                setView('tutorial');
             } else if (view === 'thumbnailSelector') {
                setView('exerciseEditor');
             } else {
                setView('home');
             }
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
            { view: 'chooseCycle', icon: BookIcon, label: 'Plan' },
            { view: 'profile', icon: UserIcon, label: 'Profile' },
            { view: 'settings', icon: SettingsIcon, label: 'Settings' },
        ];

        return (
            <footer className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-20 pb-safe">
                <nav className="flex justify-around items-center h-16">
                    {navItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setView(item.view as AppView)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                                view === item.view ? 'text-accent' : 'text-gray-500 hover:text-gray-300'
                            }`}
                            aria-label={item.label}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </footer>
        );
    };

    const renderView = () => {
        switch (view) {
            case 'onboarding':
                return (
                    <OnboardingWizard 
                        onComplete={handleCreateProfile}
                        onTakePhoto={() => { setReturnToView('onboarding'); setView('camera'); }}
                        onFromGallery={() => { setReturnToView('onboarding'); fileInputRef.current?.click(); }}
                        tempPicture={newProfilePicture}
                    />
                );
            case 'camera':
                return (
                    <CameraView 
                        onPictureTaken={handleImageSelected} 
                        onCancel={() => setView(returnToView)} 
                    />
                );
            case 'videoRecorder':
                return (
                    <VideoRecorder
                        onVideoTaken={handleVideoSelected}
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
            case 'thumbnailSelector':
                if (videoForThumbnailSelection) {
                    return <ThumbnailSelector
                        src={videoForThumbnailSelection}
                        onComplete={handleThumbnailSelected}
                        onCancel={handleBack}
                    />
                }
                setView('exerciseEditor');
                return null;
            case 'exerciseEditor':
                return <ExerciseEditorScreen
                    exerciseData={exerciseEditorData}
                    onDataChange={setExerciseEditorData}
                    originalName={originalExerciseNameForEdit}
                    onBack={handleBack}
                    onSave={handleUpsertExercise}
                    onTakePhoto={() => {
                        setReturnToView('exerciseEditor');
                        setView('camera');
                    }}
                    onRecordVideo={() => {
                        setReturnToView('exerciseEditor');
                        setView('videoRecorder');
                    }}
                    onSelectThumbnail={() => {
                        if (exerciseEditorData.video) {
                            setVideoForThumbnailSelection(exerciseEditorData.video);
                            setView('thumbnailSelector');
                        }
                    }}
                    onChooseFromGallery={() => {
                        setReturnToView('exerciseEditor');
                        fileInputRef.current?.click();
                    }}
                />;
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
                return <FinishedScreen 
                    onLogReps={handleLogReps} 
                    onContinue={handleContinueFromFinish} 
                    earnedXp={lastEarnedXp}
                    isLevelUp={isLevelUpEvent}
                    streak={currentStreak}
                />;
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
                 setView('onboarding'); 
                 return null;
            case 'tutorial':
                return <TutorialScreen
                    onSelectExercise={setModalExercise}
                    onBack={handleBack}
                    onCreateNew={() => {
                        setExerciseEditorData({ name: '', description: [], image: '', video: undefined, youtubeId: undefined });
                        setOriginalExerciseNameForEdit(null);
                        setView('exerciseEditor');
                    }}
                    onEditExercise={(exercise) => {
                        setExerciseEditorData(exercise);
                        setOriginalExerciseNameForEdit(exercise.name);
                        setView('exerciseEditor');
                    }}
                    customExercises={customExercises}
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
                            <h1 className="font-bold text-xl mx-auto uppercase tracking-wider">Select Workout</h1>
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
                    <div className="p-4 space-y-6 min-h-screen flex flex-col">
                        <div className="flex justify-center items-center py-6">
                            <h1 className="text-4xl font-black italic tracking-tighter">LEAN<span className="text-accent">X</span></h1>
                        </div>

                        {selectedWorkout && (
                            <PreviewScreen
                                workout={selectedWorkout}
                                onStart={handleStartWorkout}
                                lastResult={lastResult}
                            />
                        )}
                        
                        <div className="mt-auto pt-4">
                            <button 
                                onClick={() => setView('tutorial')} 
                                className="w-full bg-gray-900/80 backdrop-blur-md text-gray-400 font-bold py-4 rounded-2xl text-sm uppercase tracking-widest border border-dashed border-gray-700 hover:border-accent hover:text-accent transition-all"
                            >
                                View Exercise Library
                            </button>
                        </div>
                    </div>
                );
        }
    };

    const showNavBar = ['home', 'chooseCycle', 'tutorial', 'profile', 'settings'].includes(view);

    return (
        <main className={`min-h-screen bg-black text-white font-sans ${showNavBar ? 'pb-24' : ''} selection:bg-accent selection:text-black`}>
            {/* Global Background Gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 pointer-events-none z-[-1]"></div>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        if (file.type.startsWith('image/')) {
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
                        } else if (file.type.startsWith('video/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const videoDataUrl = event.target?.result as string;
                                if (videoDataUrl) {
                                    handleVideoSelected(videoDataUrl);
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    }
                    e.target.value = '';
                }}
                accept="image/*,video/*"
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
