
export interface Exercise {
  name: string;
  image: string;
  description: string[];
}

export interface Workout {
  cycle: string;
  week: string;
  day: string;
  timing: string;
  warmUp: Exercise;
  exercises: Exercise[];
  coolDown: Exercise;
  rounds?: number;
  sets?: number;
}

export type AppView = 'home' | 'workout' | 'finished' | 'repTracking' | 'profile';

export interface Profile {
  name: string;
}

// --- Types for progress tracking ---
export interface ProgressItem {
  done?: boolean;
  inProgress?: boolean;
  ts?: number;
  snap?: TimerSnapshot;
  reps?: number[];
}

export type Progress = Record<string, ProgressItem>;

export enum TimerPhase {
  GET_READY = 'getready',
  WORK = 'work',
  REST = 'rest',
  DONE = 'done'
}

export interface TimerSnapshot {
  idxWorkout: number;
  currentExerciseIndex: number; // Index in the flattened workout sequence
  phase: TimerPhase;
  seconds: number;
}


// --- Types for grouping workouts in History view ---
export interface CycleGroup {
  name:string;
  weeks: WeekGroup[];
  total: number;
  doneCount: number;
}

export interface WeekGroup {
  name: string;
  items: WorkoutItem[];
  total: number;
  doneCount: number;
}

export interface WorkoutItem {
  workout: Workout;
  index: number;
}