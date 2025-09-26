import React, { useState, useMemo } from 'react';
import type { Profile, Progress, Workout, ProgressItem } from '../types';
import { BackArrowIcon } from './icons';

interface ProfileScreenProps {
  profile: Profile | null;
  progress: Progress;
  workouts: Workout[];
  onSaveProfile: (name: string) => void;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, progress, workouts, onSaveProfile, onBack }) => {
  const [name, setName] = useState('');

  const stats = useMemo(() => {
    const workoutCount = Object.values(progress).filter((p: any) => p.done).length;

    // Get a unique, ordered list of all exercise names
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
      // Only consider completed workouts with logged reps and a timestamp
      if (!item.done || !item.reps || !item.ts) continue;

      const workoutIndex = parseInt(uid.split('|').pop() || '-1', 10);
      if (workoutIndex === -1 || !workouts[workoutIndex]) continue;
      
      const workout = workouts[workoutIndex];

      workout.exercises.forEach((exercise, i) => {
        const reps = item.reps![i] || 0;
        const currentStats = statsMap.get(exercise.name);

        if (currentStats) {
          // Total: Add reps from this workout
          currentStats.total += reps;

          // PR: Update if this workout's reps are higher
          if (reps > currentStats.pr) {
            currentStats.pr = reps;
          }

          // Last: Update if this workout is more recent
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

  const handleSave = () => {
    if (name.trim()) {
      onSaveProfile(name.trim());
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <header className="flex items-center">
            <button onClick={onBack} className="p-2 -ml-2">
                <BackArrowIcon className="w-6 h-6" />
            </button>
            <h1 className="font-semibold text-xl mx-auto">Create Profile</h1>
            <div className="w-6 h-6"></div>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-text text-center">Enter your name to start tracking your stats.</p>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-xs bg-gray-dark text-off-white text-center p-3 rounded-md"
          />
          <button
            onClick={handleSave}
            className="w-full max-w-xs bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">Profile</h1>
        <div className="w-6 h-6"></div>
      </header>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">{profile.name}</h2>
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

    </div>
  );
};
