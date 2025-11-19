
import React from 'react';
import type { Workout, ProgressItem } from '../types';

export const PreviewScreen: React.FC<{ 
    workout: Workout; 
    onStart: () => void;
    lastResult?: ProgressItem;
}> = ({ workout, onStart, lastResult }) => {
    
    return (
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-5 space-y-4 border border-gray-700/50 shadow-2xl relative overflow-hidden">
             {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start gap-6">
                <div className="flex-1 min-w-0">
                     <span className="px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold tracking-widest uppercase border border-accent/20 inline-block mb-2">Workout Overview</span>
                     <h2 className="text-3xl font-black uppercase text-white leading-tight tracking-tight truncate">
                        {workout.cycle}
                    </h2>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 text-xl font-black uppercase tracking-tight">{workout.day}</span>
                </div>
                
                {/* Big Timing Display */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col items-end min-w-[80px] flex-shrink-0">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mb-0.5 tracking-widest">Timing</span>
                    <span className="text-3xl font-black text-white tracking-tighter leading-none">{workout.timing}</span>
                </div>
            </div>

            {/* Exercise Timeline */}
            <div className="space-y-0 pt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mb-4">Workout Sequence</h3>
                <div className="relative pl-4 border-l-2 border-gray-800 space-y-5">
                    
                    {/* Warmup Node */}
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-gray-900 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                <img src={workout.warmUp.image} alt="Warmup" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Warm Up</p>
                                <p className="text-white font-bold text-sm truncate">{workout.warmUp.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Work Nodes */}
                    {workout.exercises.slice(0, 3).map((ex, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-gray-900 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 group-hover:border-accent/30 transition-colors">
                                    <img src={ex.image} alt={ex.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-gray-200 text-sm font-bold truncate">{ex.name}</p>
                                        {lastResult?.reps && lastResult.reps[i] ? (
                                        <p className="text-[10px] text-accent font-mono">PB: {Math.max(...(lastResult.reps || [0]))} reps</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}

                    {workout.exercises.length > 3 && (
                        <div className="relative pl-1">
                             <p className="text-xs text-gray-500 italic">+ {workout.exercises.length - 3} more exercises</p>
                        </div>
                    )}

                    {/* Cooldown Node */}
                    <div className="relative pb-1">
                        <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-teal-500 border-2 border-gray-900"></div>
                         <div className="flex items-center gap-3">
                             <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                                <img src={workout.coolDown.image} alt="Cooldown" className="w-full h-full object-cover opacity-60" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-teal-500 text-[10px] font-bold uppercase tracking-wider">Cool Down</p>
                                <p className="text-gray-300 font-bold text-sm truncate">{workout.coolDown.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={onStart} 
                className="w-full relative group overflow-hidden bg-accent text-black font-black py-4 rounded-2xl text-xl tracking-widest uppercase transition-transform active:scale-95 shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:shadow-[0_0_50px_rgba(74,222,128,0.6)] mt-2"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Workout
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
        </div>
    );
};
