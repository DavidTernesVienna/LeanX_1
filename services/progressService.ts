

import type { Workout, Progress, TimerSnapshot, Profile, Settings, Exercise, ProfileStats } from '../types';

const SCHEMA_VERSION = 1;

const PROGRESS_KEY = 'leanTimerProgress';
const RESUME_KEY = 'leanTimerResume';
const COLLAPSE_KEY = 'leanTimerCollapse';
const YT_KEY = 'leanTimerYT';
const PROFILE_KEY = 'leanTimerProfile';
const SETTINGS_KEY = 'leanTimerSettings';
const CUSTOM_EXERCISES_KEY = 'leanTimerCustomExercises';

export const getWorkoutUID = (workout: Workout): string => workout.id;

interface VersionedData<T> {
  version: number;
  data: T;
}

// --- Settings Management ---
export const loadSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all keys are present for backward compatibility
      return {
        audioCues: parsed.audioCues ?? true,
        trackReps: parsed.trackReps ?? true,
        enableWarmup: parsed.enableWarmup ?? true,
        enableCooldown: parsed.enableCooldown ?? true,
        enableGlassMotion: parsed.enableGlassMotion ?? true,
        pauseOnRepCount: parsed.pauseOnRepCount ?? true,
        enableColor: parsed.enableColor ?? true,
        enableWakeLock: parsed.enableWakeLock ?? true,
      };
    }
  } catch {
    // ignore error, return default
  }
  // Default settings
  return { 
    audioCues: true, 
    trackReps: true,
    enableWarmup: true,
    enableCooldown: true,
    enableGlassMotion: true,
    pauseOnRepCount: true,
    enableColor: true,
    enableWakeLock: true,
  }; 
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- Profile Management ---
export const loadProfile = (): Profile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === SCHEMA_VERSION) {
      return parsed.data as Profile;
    }
    
    // No version or old version, treat as simple data and re-save it in new format
    const profileData = parsed as Profile; 
    
    // Initialize stats if missing
    if(!profileData.stats) {
        profileData.stats = {
            totalXp: 0,
            level: 1,
            currentStreak: 0,
            bestStreak: 0,
            lastWorkoutDate: null,
            workoutsCompleted: 0
        };
    }

    saveProfile(profileData); 
    return profileData;

  } catch {
    return null;
  }
};

export const saveProfile = (profile: Profile): void => {
  const versionedData: VersionedData<Profile> = {
    version: SCHEMA_VERSION,
    data: profile,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(versionedData));
};


// --- Gamification Logic ---
export const calculateXp = (workout: Workout): number => {
    // Base XP: (work + rest) * rounds * exercises
    const cycleTimeSeconds = (workout.work + workout.rest) * workout.exercises.length * workout.rounds;
    // Normalize: ~10 XP per minute of intense work
    return Math.round(cycleTimeSeconds / 6); 
};

export const calculateLevel = (xp: number): number => {
    // Simple RPG curve: Level = sqrt(XP / 100) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getLevelProgress = (xp: number): number => {
    const currentLevel = calculateLevel(xp);
    const nextLevel = currentLevel + 1;
    const xpForCurrent = 100 * Math.pow(currentLevel - 1, 2);
    const xpForNext = 100 * Math.pow(nextLevel - 1, 2);
    
    return Math.min(100, Math.max(0, ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100));
};

export const updateProfileStats = (workout: Workout): { profile: Profile, xpGained: number, levelUp: boolean } | null => {
    const profile = loadProfile();
    if (!profile) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let stats = profile.stats || {
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        lastWorkoutDate: null,
        workoutsCompleted: 0
    };

    // Calculate XP
    const xpGained = calculateXp(workout);
    stats.totalXp += xpGained;
    
    const oldLevel = stats.level;
    stats.level = calculateLevel(stats.totalXp);
    const levelUp = stats.level > oldLevel;

    stats.workoutsCompleted += 1;

    // Calculate Streak
    if (stats.lastWorkoutDate !== today) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (stats.lastWorkoutDate === yesterdayStr) {
            stats.currentStreak += 1;
        } else {
            stats.currentStreak = 1; // Reset or start new
        }
        
        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }
        stats.lastWorkoutDate = today;
    }

    profile.stats = stats;
    saveProfile(profile);

    return { profile, xpGained, levelUp };
};


// --- Progress Management ---
export const loadProgress = (): Progress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    // If it's correctly versioned, return data
    if (parsed && parsed.version === SCHEMA_VERSION) {
      return parsed.data as Progress;
    }
    
    // --- MIGRATION from v0 to v1 ---
    console.log("Migrating progress data to schema v1...");
    const oldProgress = parsed as Progress;
    const migratedProgress: Progress = {};

    for (const key in oldProgress) {
        if (Object.prototype.hasOwnProperty.call(oldProgress, key)) {
            const item = oldProgress[key];
            if (item.inProgress || item.snap) {
                console.warn(`Migration: Clearing stale in-progress state for workout key: ${key}`);
                item.inProgress = false;
                delete item.snap;
            }
            migratedProgress[key] = item;
        }
    }

    saveProgress(migratedProgress); 
    return migratedProgress;

  } catch (e) {
    console.error("Failed to load or migrate progress, resetting.", e);
    localStorage.removeItem(PROGRESS_KEY);
    return {};
  }
};

export const saveProgress = (progress: Progress): void => {
  const versionedData: VersionedData<Progress> = {
    version: SCHEMA_VERSION,
    data: progress,
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(versionedData));
};

export const markDone = (uid: string): Progress => {
  const p = loadProgress();
  p[uid] = { ...(p[uid] || {}), done: true, inProgress: false, ts: Date.now() };
  delete p[uid].snap;
  saveProgress(p);
  return p;
};

export const markInProgress = (uid: string, snap: TimerSnapshot): Progress => {
  const p = loadProgress();
  p[uid] = { ...(p[uid] || {}), done: false, inProgress: true, snap, ts: Date.now() };
  saveProgress(p);
  return p;
};

export const clearInProgress = (uid: string): Progress => {
    const p = loadProgress();
    if (p[uid]) {
      p[uid].inProgress = false;
      delete p[uid].snap;
    }
    saveProgress(p);
    return p;
}

export const saveRepsForWorkout = (uid: string, reps: number[]): Progress => {
  const p = loadProgress();
  if (p[uid]) {
    p[uid].reps = reps;
    p[uid].ts = Date.now(); 
  }
  saveProgress(p);
  return p;
};

export const resetAllProgress = (): Progress => {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(RESUME_KEY);
  return {};
};


// --- Resume Management ---
export const storeResume = (snap: TimerSnapshot): void => {
  localStorage.setItem(RESUME_KEY, JSON.stringify(snap));
};

export const loadResume = (): TimerSnapshot | null => {
  try {
    return JSON.parse(localStorage.getItem(RESUME_KEY) || 'null');
  } catch {
    return null;
  }
};

export const clearResume = (): void => {
  localStorage.removeItem(RESUME_KEY);
};

// --- Custom Exercises Management ---
export const loadCustomExercises = (): Exercise[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    if (raw) {
      return JSON.parse(raw) as Exercise[];
    }
  } catch {
    // ignore error
  }
  return [];
};

export const saveCustomExercises = (exercises: Exercise[]): void => {
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
};

export const addCustomExercise = (exercise: Exercise): Exercise[] => {
  const exercises = loadCustomExercises();
  const existingIndex = exercises.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase());
  if (existingIndex > -1) {
    exercises[existingIndex] = exercise;
  } else {
    exercises.push(exercise);
  }
  saveCustomExercises(exercises);
  return exercises;
};


// --- UI State ---
export const getCollapseState = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const setCollapseState = (obj: Record<string, boolean>): void => {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(obj));
};

export const getMusicId = (): string | null => {
  return localStorage.getItem(YT_KEY);
};

export const setMusicId = (id: string): void => {
  localStorage.setItem(YT_KEY, id);
};

export const clearMusicId = (): void => {
  localStorage.removeItem(YT_KEY);
};

// --- Data Parsing ---
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const extractArrayText = (s: string) => {
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
    return s.trim();
};
const jsLikeToJson = (s: string) => {
    let out = s.replace(/([,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
    out = out.replace(/,\s*([}\]])/g, '$1');
    return out;
};

export const parseCyclesText = (txt: string): Workout[] | null => {
    if (!txt) return null;
    let s = stripComments(txt);
    try {
        const j = JSON.parse(s);
        if (Array.isArray(j)) return j;
    } catch (_) {}

    let arr = extractArrayText(s);
    arr = jsLikeToJson(arr);

    try {
        return JSON.parse(arr);
    } catch (_) {}

    try {
        return JSON.parse(arr.replace(/'([^']*)'/g, '"$1"'));
    } catch (err) {
        console.error('Failed to parse workout file', err);
    }

    return null;
};