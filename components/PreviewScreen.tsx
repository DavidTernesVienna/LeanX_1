import React from 'react';
import type { Workout, ProgressItem } from '../types';

export const PreviewScreen: React.FC<{ 
    workout: Workout; 
    onStart: () => void;
    lastResult?: ProgressItem;
}> = ({ workout, onStart, lastResult }) => {
    
    const workoutTitle = `${workout.cycle}, ${workout.week}, ${workout.day}`;

    return (
        <div className="bg-gray-dark rounded-xl p-4 space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-text">Next up</p>
                    <p className="text-sm text-gray-text">timing</p>
                </div>
                <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-bold">{workoutTitle}</h2>
                    <div className="font-semibold text-2xl text-off-white">{workout.timing}</div>
                </div>
            </div>

            <div className="space-y-4 text-off-white/80 pt-4 border-t border-gray-light/50 px-4">
                <div className="flex items-center gap-4">
                    <img src={workout.warmUp.image} alt={workout.warmUp.name} className="w-12 h-12 rounded-md object-cover bg-gray-light flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-gray-text">Warm Up</p>
                        <p className="text-off-white text-lg">{workout.warmUp.name}</p>
                    </div>
                </div>

                {workout.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-4 pl-8">
                        <img src={ex.image} alt={ex.name} className="w-12 h-12 rounded-md object-cover bg-gray-light flex-shrink-0" />
                        <p className="text-lg">{ex.name}</p>
                    </div>
                ))}
                
                <div className="flex items-center gap-4">
                    <img src={workout.coolDown.image} alt={workout.coolDown.name} className="w-12 h-12 rounded-md object-cover bg-gray-light flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-gray-text">Cool Down</p>
                        <p className="text-off-white text-lg">{workout.coolDown.name}</p>
                    </div>
                </div>
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