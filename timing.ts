
import type { Workout } from './types';

export const parseTiming = (timing: string, overrideRounds?: number): { work: number; rest: number; rounds: number } => {
    let work = 40, rest = 20, rounds = 3;

    if (!timing) {
        if (overrideRounds !== undefined) rounds = overrideRounds;
        return { work, rest, rounds };
    }
    
    const t = timing.trim();

    // Try key-value pair format e.g., "work=40, rest=20, rounds=3"
    const kvMatch = t.matchAll(/([a-zA-Z]+)\s*=\s*(\d+)/g);
    let matchedKv = false;
    for (const match of kvMatch) {
        const [, key, value] = match;
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) continue;

        const lowerKey = key.toLowerCase();
        if (lowerKey === 'work') { work = numValue; matchedKv = true; }
        if (lowerKey === 'rest') { rest = numValue; matchedKv = true; }
        if (lowerKey === 'rounds') { rounds = numValue; matchedKv = true; }
    }
    
    if (matchedKv) {
        if (overrideRounds !== undefined) {
            rounds = overrideRounds;
        }
        return { work, rest, rounds };
    }

    // Try slash/dash format e.g., "40/20x3" or "40-20 x 3"
    const slashMatch = t.match(/^(\d+)\s*[\/-]\s*(\d+)(?:\s*[xX]\s*(\d+))?/);
    if (slashMatch) {
        work = parseInt(slashMatch[1], 10);
        rest = parseInt(slashMatch[2], 10);
        if (slashMatch[3]) {
            rounds = parseInt(slashMatch[3], 10);
        }
    }

    if (overrideRounds !== undefined) {
        rounds = overrideRounds;
    }

    return { work, rest, rounds };
};

export const assertWorkout = (w: Workout | null | undefined): w is Workout => {
    if (!w) {
        console.warn('Validator failed: Workout is null or undefined.');
        return false;
    }
    if (typeof w.id !== 'string' || w.id.length === 0) {
        console.warn('Validator failed: Workout has invalid id.', w);
        return false;
    }
    if (typeof w.work !== 'number' || w.work < 0) {
        console.warn('Validator failed: Workout has invalid work duration.', w);
        return false;
    }
    if (typeof w.rest !== 'number' || w.rest < 0) {
        console.warn('Validator failed: Workout has invalid rest duration.', w);
        return false;
    }
    if (typeof w.rounds !== 'number' || w.rounds <= 0) {
        console.warn('Validator failed: Workout has invalid rounds count.', w);
        return false;
    }
    if (!Array.isArray(w.exercises) || w.exercises.length === 0) {
        console.warn('Validator failed: Workout has no exercises.', w);
        return false;
    }
    return true;
};