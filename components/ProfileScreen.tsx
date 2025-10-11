

import React, { useMemo, useState } from 'react';
import type { Profile, Progress, Workout, ProgressItem } from '../types';
import { BackArrowIcon, UserIcon, CameraIcon, PenIcon, CheckIcon, PhotoIcon } from './icons';

interface ProfileScreenProps {
  profile: Profile;
  progress: Progress;
  workouts: Workout[];
  onUpdateProfile: (profile: Profile) => void;
  onBack: () => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, progress, workouts, onUpdateProfile, onBack, onTakePhoto, onChooseFromGallery }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(profile.name);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const stats = useMemo(() => {
    const workoutCount = Object.values(progress).filter((p: any) => p.done).length;

    const uniqueExerciseNames: string[] = [];
    const seen = new Set<string>();
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        if (!seen.has(e.name)) {
          seen.add(e.name);
          uniqueExerciseNames.push(e.name);
        }
      });
    });

    const statsMap = new Map<string, { last: number; pr: number; total: number; lastTs: number }>();
    uniqueExerciseNames.forEach(name => {
      statsMap.set(name, { last: 0, pr: 0, total: 0, lastTs: 0 });
    });

    for (const [uid, pItem] of Object.entries(progress)) {
      const item = pItem as ProgressItem;
      if (!item.done || !item.reps || !item.ts) continue;

      const workout = workouts.find(w => w.id === uid);
      if (!workout) continue;
      
      workout.exercises.forEach((exercise, i) => {
        const reps = item.reps![i] || 0;
        const currentStats = statsMap.get(exercise.name);

        if (currentStats) {
          currentStats.total += reps;
          if (reps > currentStats.pr) {
            currentStats.pr = reps;
          }
          if (item.ts! > currentStats.lastTs) {
            currentStats.last = reps;
            currentStats.lastTs = item.ts!;
          }
        }
      });
    }
    
    const exerciseStats = uniqueExerciseNames.map(name => ({
        name,
        ...(statsMap.get(name)!)
    }));

    return { workoutCount, exerciseStats };
  }, [progress, workouts]);

  const handleSaveName = () => {
    if (editingName.trim()) {
      onUpdateProfile({ ...profile, name: editingName.trim() });
      setIsEditingName(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 overflow-y-auto">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">Profile</h1>
        <div className="w-6 h-6"></div>
      </header>

      <div className="text-center mb-8 relative w-32 h-32 mx-auto">
          <div className="w-32 h-32 rounded-2xl bg-gray-dark flex items-center justify-center border-2 border-gray-light">
            {profile.picture ? (
                <img src={profile.picture} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
            ) : (
                <UserIcon className="w-24 h-24 text-gray-light" />
            )}
        </div>
        <div className="absolute bottom-[-8px] right-[-8px]">
            <button 
                onClick={() => setShowImageOptions(true)}
                className="bg-accent text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-transform active:scale-90"
                aria-label="Change profile picture"
            >
                <CameraIcon className="w-6 h-6" />
            </button>
        </div>
      </div>

      <div className="text-center mb-8 -mt-4">
        {isEditingName ? (
            <div className="flex justify-center items-center gap-2">
                <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                    className="bg-gray-dark text-off-white text-center text-3xl font-bold p-1 rounded-md border border-gray-light w-64"
                    autoFocus
                    onBlur={handleSaveName}
                />
                <button onClick={handleSaveName} className="p-2 bg-accent rounded-full flex-shrink-0">
                    <CheckIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        ) : (
            <div className="flex justify-center items-center gap-2">
                <h2 className="text-3xl font-bold">{profile.name}</h2>
                 <button 
                    onClick={() => setIsEditingName(true)}
                    className="bg-gray-light text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-transform active:scale-90"
                    aria-label="Edit name"
                >
                    <PenIcon className="w-5 h-5" />
                </button>
            </div>
        )}
      </div>

      <div className="bg-gray-dark p-4 rounded-xl mb-6">
        <div className="text-center">
            <div className="text-5xl font-bold text-accent">{stats.workoutCount}</div>
            <div className="text-sm text-gray-text uppercase font-semibold">Workouts Completed</div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col bg-gray-dark rounded-xl p-4 space-y-3">
        <h3 className="font-bold text-lg text-center">Exercise Totals</h3>
        <div className="overflow-y-auto flex-grow pr-1">
            <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-10 gap-2 text-xs text-gray-text font-semibold px-3 py-2 uppercase">
                    <span className="col-span-4 text-left">Exercise</span>
                    <span className="col-span-2 text-center">Last</span>
                    <span className="col-span-2 text-center">PR</span>
                    <span className="col-span-2 text-center">Total</span>
                </div>
                {/* List */}
                <ul className="space-y-2">
                    {stats.exerciseStats.map((stat) => (
                        <li key={stat.name} className="grid grid-cols-10 gap-2 items-center bg-gray-light p-3 rounded-md">
                            <span className="col-span-4 text-sm text-off-white truncate" title={stat.name}>{stat.name}</span>
                            <span className="col-span-2 font-semibold text-center">{stat.last}</span>
                            <span className="col-span-2 font-bold text-center text-accent">{stat.pr}</span>
                            <span className="col-span-2 font-semibold text-center">{stat.total}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
       {showImageOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowImageOptions(false)}>
            <div className="bg-gray-dark p-4 rounded-t-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <button onClick={() => { onTakePhoto(); setShowImageOptions(false); }} className="p-4 bg-gray-light rounded-lg flex flex-col items-center gap-2">
                        <CameraIcon className="w-8 h-8"/>
                        <span>Take Photo</span>
                    </button>
                    <button onClick={() => { onChooseFromGallery(); setShowImageOptions(false); }} className="p-4 bg-gray-light rounded-lg flex flex-col items-center gap-2">
                        <PhotoIcon className="w-8 h-8"/>
                        <span>From Gallery</span>
                    </button>
                </div>
            </div>
        </div>
    )}
    </div>
  );
};