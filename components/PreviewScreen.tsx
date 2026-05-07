


import React from 'react';
import type { Workout, ProgressItem } from '../types';
import { FireIcon, SnowflakeIcon } from './icons';

export const PreviewScreen: React.FC<{ 
    workout: Workout; 
    onStart: () => void;
    lastResult?: ProgressItem;
}> = ({ workout, onStart, lastResult }) => {
    
    return (
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-5 space-y-5 border border-gray-700/50 shadow-2xl relative overflow-hidden">
             {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start gap-2 pt-1">
                <div className="flex-1 min-w-0">
                     <h2 className="text-lg font-black uppercase text-white leading-tight tracking-tight break-words">
                        {workout.cycle}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 font-black uppercase tracking-tight mt-0.5">
                        <span className="text-xs text-white">{workout.week}</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-xs">{workout.day}</span>
                    </div>
                </div>
                
                {/* Big Timing Display */}
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-2 border border-white/10 flex flex-col items-end min-w-[50px] flex-shrink-0">
                    <span className="text-[8px] text-gray-500 uppercase font-bold mb-0.5 tracking-widest">Timing</span>
                    <span className="text-base font-black text-white tracking-tighter leading-none">{workout.timing}</span>
                </div>
            </div>

            {/* Exercise Timeline */}
            <div className="space-y-0 pt-3">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-3">Workout Sequence</h3>
                <div className="relative pl-6 space-y-4">
                    
                    {/* The Line - Starts at center of first item, ends at center of last item */}
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-800 -translate-x-1/2"></div>

                    {/* Warmup Node */}
                    <div className="relative">
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 flex justify-center z-10">
                             <div className="w-5 h-5 bg-gray-900 rounded-full border border-orange-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                                 <FireIcon className="w-2.5 h-2.5 text-orange-500" />
                             </div>
                        </div>
                        <div className="flex items-center gap-2.5 group">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 group-hover:border-orange-500/50 transition-colors">
                                <img src={workout.warmUp.image} alt="Warmup" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-orange-400 text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5">Warm Up</p>
                                <p className="text-white font-bold text-[11px] truncate">{workout.warmUp.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Work Nodes */}
                    {workout.exercises.slice(0, 3).map((ex, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 flex justify-center z-10">
                                <div className="w-2 h-2 rounded-full bg-accent border-[1.5px] border-gray-900 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                            </div>
                            <div className="flex items-center gap-2.5 group">
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 group-hover:border-accent/30 transition-colors">
                                    <img src={ex.image} alt={ex.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-gray-200 text-[11px] font-bold truncate">{ex.name}</p>
                                        {lastResult?.reps && lastResult.reps[i] ? (
                                        <p className="text-[8px] text-accent font-mono leading-none mt-0.5">PB: {Math.max(...(lastResult.reps || [0]))} reps</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}

                    {workout.exercises.length > 3 && (
                        <div className="relative pl-1">
                             <p className="text-[9px] text-gray-500 italic">+ {workout.exercises.length - 3} more exercises</p>
                        </div>
                    )}

                    {/* Cooldown Node */}
                    <div className="relative pb-1">
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 flex justify-center z-10">
                             <div className="w-5 h-5 bg-gray-900 rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                 <SnowflakeIcon className="w-2.5 h-2.5 text-blue-400" />
                             </div>
                        </div>
                         <div className="flex items-center gap-2.5">
                             <div className="w-7 h-7 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                                <img src={workout.coolDown.image} alt="Cooldown" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-blue-400 text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5">Cool Down</p>
                                <p className="text-gray-300 font-bold text-[11px] truncate">{workout.coolDown.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={onStart} 
                className="w-full relative group overflow-hidden bg-accent text-black font-black py-2.5 rounded-xl text-sm tracking-widest uppercase transition-transform active:scale-95 shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:shadow-[0_0_50px_rgba(74,222,128,0.6)] mt-2"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Workout
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
        </div>
    );
};