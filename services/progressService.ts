
import type { Workout, Progress, TimerSnapshot, Profile, Settings } from '../types';

const SCHEMA_VERSION = 1;

const PROGRESS_KEY = 'leanTimerProgress';
const RESUME_KEY = 'leanTimerResume';
const COLLAPSE_KEY = 'leanTimerCollapse';
const YT_KEY = 'leanTimerYT';
const PROFILE_KEY = 'leanTimerProfile';
const SETTINGS_KEY = 'leanTimerSettings';

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
      return JSON.parse(raw) as Settings;
    }
  } catch {
    // ignore error, return default
  }
  // Default settings
  return { audioCues: true, trackReps: true }; 
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
            // The breaking change was in TimerSnapshot (idxWorkout -> workoutId).
            // Safest migration is to clear any in-progress state.
            if (item.inProgress || item.snap) {
                console.warn(`Migration: Clearing stale in-progress state for workout key: ${key}`);
                item.inProgress = false;
                delete item.snap;
            }
            migratedProgress[key] = item;
        }
    }

    saveProgress(migratedProgress); // Save in new versioned format
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
    p[uid].ts = Date.now(); // Also update timestamp
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