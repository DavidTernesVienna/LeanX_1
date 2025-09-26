
export type RawWorkout = {
  cycle: string;
  week: string;
  day: string;
  timing: string;
  warmUp: string;
  exercises: string[];
  coolDown: string;
  rounds?: number;
};

export interface Exercise {
  name: string;
  image: string;
  description: string[];
}

export type Workout = Omit<RawWorkout, 'warmUp' | 'exercises' | 'coolDown' | 'rounds'> & {
  id: string;
  work: number;
  rest: number;
  rounds: number;
  warmUp: Exercise;
  exercises: Exercise[];
  coolDown: Exercise;
};


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

export type WorkoutPhase = 'getready' | 'warmup' | 'work' | 'rest' | 'cooldown' | 'done';

export enum TimerPhase {
  GET_READY = 'getready',
  WORK = 'work',
  REST = 'rest',
  DONE = 'done'
}

export interface TimerSnapshot {
  workoutId: string;
  phase: WorkoutPhase;
  round: number;
  exerciseIndex: number;
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