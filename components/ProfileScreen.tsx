
import React, { useMemo, useState } from 'react';
import type { Profile, Progress, Workout, ProgressItem } from '../types';
import { BackArrowIcon, UserIcon, CameraIcon, PenIcon, CheckIcon, PhotoIcon, ChevronDownIcon, FireIcon, TrophyIcon, StarIcon } from './icons';
import { getLevelProgress } from '../services/progressService';

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
  const [isTotalsOpen, setIsTotalsOpen] = useState(false);

  const stats = useMemo(() => {
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
    })).sort((a, b) => a.name.localeCompare(b.name));

    return { exerciseStats };
  }, [progress, workouts]);

  const handleSaveName = () => {
    if (editingName.trim()) {
      onUpdateProfile({ ...profile, name: editingName.trim() });
      setIsEditingName(false);
    }
  };

  const levelProgress = getLevelProgress(profile.stats?.totalXp || 0);

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-black to-gray-900">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-800 rounded-full transition-colors">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-xl mx-auto tracking-wide">MY PROFILE</h1>
        <div className="w-6 h-6"></div>
      </header>

      {/* Gamer Card Header */}
      <div className="relative bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-xl mb-6 overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

         <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-28 h-28 mb-4">
                 <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600 shadow-lg overflow-hidden">
                    {profile.picture ? (
                        <img src={profile.picture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-16 h-16 text-gray-400" />
                    )}
                </div>
                <button 
                    onClick={() => setShowImageOptions(true)}
                    className="absolute bottom-0 right-0 bg-accent text-white w-9 h-9 rounded-full flex items-center justify-center border-4 border-gray-800 hover:scale-110 transition-transform shadow-md"
                    aria-label="Change profile picture"
                >
                    <CameraIcon className="w-4 h-4" />
                </button>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 px-3 py-0.5 rounded-full border border-gray-600 text-xs font-bold text-accent shadow-sm">
                    LVL {profile.stats?.level || 1}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                {isEditingName ? (
                    <div className="flex justify-center items-center gap-2">
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                            className="bg-black/40 text-off-white text-center text-2xl font-bold p-1 rounded-md border border-gray-600 w-48 focus:border-accent outline-none"
                            autoFocus
                            onBlur={handleSaveName}
                        />
                        <button onClick={handleSaveName} className="p-1.5 bg-accent rounded-full flex-shrink-0 hover:bg-accent/80">
                            <CheckIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditingName(true)} className="flex items-center gap-2 group">
                        <h2 className="text-2xl font-bold text-white tracking-tight group-hover:text-accent transition-colors">{profile.name}</h2>
                         <PenIcon className="w-4 h-4 text-gray-500 group-hover:text-accent transition-colors opacity-0 group-hover:opacity-100" />
                    </button>
                )}
            </div>

            {/* XP Bar */}
            <div className="w-full max-w-xs mb-2">
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
                    <span>XP Progress</span>
                    <span>{Math.round(levelProgress)}%</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-accent transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
                </div>
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-1 shadow-lg">
              <TrophyIcon className="w-8 h-8 text-yellow-400 mb-1" />
              <span className="text-2xl font-bold text-white">{profile.stats?.workoutsCompleted || 0}</span>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Completed</span>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-1 shadow-lg">
              <FireIcon className="w-8 h-8 text-orange-500 mb-1" />
              <span className="text-2xl font-bold text-white">{profile.stats?.currentStreak || 0}</span>
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Day Streak</span>
          </div>
           <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-1 shadow-lg col-span-2 flex-row justify-around">
               <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{profile.stats?.bestStreak || 0}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Best Streak</span>
               </div>
               <div className="h-8 w-[1px] bg-gray-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-white">{profile.stats?.totalXp || 0}</span>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Total XP</span>
               </div>
          </div>
      </div>

      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <button
          onClick={() => setIsTotalsOpen(!isTotalsOpen)}
          className="w-full flex justify-between items-center text-left font-bold text-lg p-4 bg-gray-800 hover:bg-gray-750 transition-colors"
          aria-expanded={isTotalsOpen}
        >
          <span className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-accent" />
              Exercise Mastery
          </span>
          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isTotalsOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isTotalsOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
          <div className="px-4 pb-4">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600">
                {/* Header */}
                <div className="grid grid-cols-10 gap-2 text-[10px] text-gray-400 font-bold px-3 py-2 uppercase tracking-wider">
                    <span className="col-span-4 text-left">Exercise</span>
                    <span className="col-span-2 text-center">Last</span>
                    <span className="col-span-2 text-center">PR</span>
                    <span className="col-span-2 text-center">Total</span>
                </div>
                {/* List */}
                <ul className="space-y-2">
                    {stats.exerciseStats.map((stat) => (
                        <li key={stat.name} className="grid grid-cols-10 gap-2 items-center bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-black/30 transition-colors">
                            <span className="col-span-4 text-sm text-gray-200 truncate font-medium" title={stat.name}>{stat.name}</span>
                            <span className="col-span-2 font-semibold text-center text-gray-400">{stat.last}</span>
                            <span className="col-span-2 font-bold text-center text-accent">{stat.pr}</span>
                            <span className="col-span-2 font-semibold text-center text-gray-400">{stat.total}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      </div>

       {showImageOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowImageOptions(false)}>
            <div className="bg-gray-800 p-6 rounded-t-2xl w-full max-w-md border-t border-gray-700" onClick={e => e.stopPropagation()}>
                <h3 className="text-center text-gray-400 font-semibold mb-4">Update Profile Picture</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <button onClick={() => { onTakePhoto(); setShowImageOptions(false); }} className="p-6 bg-gray-700 hover:bg-gray-600 rounded-xl flex flex-col items-center gap-3 transition-colors group">
                        <CameraIcon className="w-8 h-8 text-white group-hover:text-accent transition-colors"/>
                        <span className="font-medium text-gray-200">Take Photo</span>
                    </button>
                    <button onClick={() => { onChooseFromGallery(); setShowImageOptions(false); }} className="p-6 bg-gray-700 hover:bg-gray-600 rounded-xl flex flex-col items-center gap-3 transition-colors group">
                        <PhotoIcon className="w-8 h-8 text-white group-hover:text-accent transition-colors"/>
                        <span className="font-medium text-gray-200">From Gallery</span>
                    </button>
                </div>
                <button onClick={() => setShowImageOptions(false)} className="w-full mt-6 py-3 text-gray-400 hover:text-white transition-colors">Cancel</button>
            </div>
        </div>
    )}
    </div>
  );
};
