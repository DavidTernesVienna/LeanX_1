
import type { Workout, Progress, TimerSnapshot, Profile } from '../types';

const PROGRESS_KEY = 'leanTimerProgress';
const RESUME_KEY = 'leanTimerResume';
const COLLAPSE_KEY = 'leanTimerCollapse';
const YT_KEY = 'leanTimerYT';
const PROFILE_KEY = 'leanTimerProfile';

export const getWorkoutUID = (workout: Workout, index: number): string => 
  `${workout.cycle || 'Cycle'}|${workout.week || 'Week'}|${workout.day || 'Day'}|${index}`;

// --- Profile Management ---
export const loadProfile = (): Profile | null => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const saveProfile = (profile: Profile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};


// --- Progress Management ---
export const loadProgress = (): Progress => {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveProgress = (progress: Progress): void => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const markDone = (uid: string): Progress => {
  const p = loadProgress();
  p[uid] = { ...(p[uid] || {}), done: true, inProgress: false, ts: Date.now() };
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

// --- Timing Parsing ---
export const parseTiming = (entry: Workout): { work: number, rest: number, rounds: number } => {
    let work = 40, rest = 20, rounds = 3;
    const t = String(entry.timing || '').trim();
    const m = t.match(/^(\d+)\s*\/\s*(\d+)(?:\s*[xX]\s*(\d+))?/);
    if (m) {
        work = +m[1];
        rest = +m[2];
        if (m[3]) rounds = +m[3];
    }
    if (Number.isFinite(entry.rounds)) rounds = entry.rounds!;
    if (Number.isFinite(entry.sets)) rounds = entry.sets!;
    return { work, rest, rounds };
};