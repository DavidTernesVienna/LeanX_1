
import React from 'react';
import type { Workout, ProgressItem } from '../types';
import * as ProgressService from '../services/progressService';

export const PreviewScreen: React.FC<{ 
    workout: Workout; 
    onStart: () => void;
    lastResult?: ProgressItem;
}> = ({ workout, onStart, lastResult }) => {
    
    const { work, rest, rounds } = ProgressService.parseTiming(workout);

    const totalDurationMinutes = Math.ceil(
      ( (work + rest) * workout.exercises.length * rounds ) / 60
    );
    
    const workoutTitle = `${workout.cycle}, ${workout.week}, ${workout.day}`;

    return (
        <div className="bg-gray-dark rounded-xl p-4 space-y-4">
            <div>
                <p className="text-sm text-gray-text">Next up</p>
                <h2 className="text-xl font-bold">{workoutTitle}</h2>
            </div>
            
            <div className="flex items-center justify-between text-center">
                <div>
                    <span className="text-4xl font-bold">{totalDurationMinutes}</span>
                    <span className="text-lg font-semibold ml-1">min</span>
                </div>
                <div className="text-gray-text">
                     <div className="font-semibold text-lg text-off-white">{workout.timing}</div>
                    <div>timing</div>
                </div>
            </div>

            <div className="text-sm space-y-1 text-off-white/80 max-h-40 overflow-y-auto pt-2 border-t border-gray-light/50">
                <p><span className="font-semibold">Warm Up:</span> {workout.warmUp.name}</p>
                {workout.exercises.map((ex, i) => (
                    <p key={i}>• {ex.name}</p>
                ))}
                <p><span className="font-semibold">Cool Down:</span> {workout.coolDown.name}</p>
            </div>

            {lastResult?.reps && lastResult.reps.length > 0 && (
                <div className="pt-2">
                    <h3 className="font-bold text-sm text-gray-text mb-2">Last Results</h3>
                    <div className="space-y-1 bg-gray-light/50 p-3 rounded-lg">
                        {workout.exercises.map((ex, index) => (
                            <div key={index} className="flex justify-between text-xs">
                                <span className="text-gray-text">{ex.name}</span>
                                <span className="font-semibold">{lastResult.reps?.[index] ?? 0} reps</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <button 
                onClick={onStart} 
                className="w-full bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95 mt-2"
            >
                START WORKOUT
            </button>
        </div>
    );
};
