
import React, { useState, useMemo } from 'react';
import type { Workout, Progress, CycleGroup, WorkoutItem } from '../types';
import * as ProgressService from '../services/progressService';
import { CheckIcon, TrophyIcon, ChevronDownIcon } from './icons';

interface HistoryProps {
  workouts: Workout[];
  progress: Progress;
  onSelectWorkout: (index: number) => void;
  onUpdateProgress: (newProgress: Progress) => void;
  selectedWorkoutIndex: number | null;
}

const groupWorkouts = (workouts: Workout[], progress: Progress): CycleGroup[] => {
    const map = new Map<string, Map<string, WorkoutItem[]>>();
    workouts.forEach((w, i) => {
        const cycleName = w.cycle || 'Cycle';
        const weekName = w.week || 'Week';
        if (!map.has(cycleName)) map.set(cycleName, new Map());
        const cycleMap = map.get(cycleName)!;
        if (!cycleMap.has(weekName)) cycleMap.set(weekName, []);
        cycleMap.get(weekName)!.push({ workout: w, index: i });
    });

    return Array.from(map.entries()).map(([cycleName, weekMap]) => {
        const allItems = Array.from(weekMap.values()).flat();
        const doneCount = allItems.filter(item => progress[ProgressService.getWorkoutUID(item.workout)]?.done).length;
        
        return {
            name: cycleName,
            weeks: Array.from(weekMap.entries()).map(([weekName, items]) => {
                const weekDoneCount = items.filter(item => progress[ProgressService.getWorkoutUID(item.workout)]?.done).length;
                return {
                    name: weekName,
                    items,
                    total: items.length,
                    doneCount: weekDoneCount,
                };
            }).sort((a,b) => a.name.localeCompare(b.name)),
            total: allItems.length,
            doneCount: doneCount,
        };
    });
};

export const History: React.FC<HistoryProps> = ({ workouts, progress, onSelectWorkout, onUpdateProgress, selectedWorkoutIndex }) => {
  const [openCycles, setOpenCycles] = useState<Record<string, boolean>>(() => ProgressService.getCollapseState());
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({});

  const cycleGroups = useMemo(() => groupWorkouts(workouts, progress), [workouts, progress]);

  const toggleCycle = (name: string) => {
    const newState = { ...openCycles, [name]: !openCycles[name] };
    setOpenCycles(newState);
    ProgressService.setCollapseState(newState);
  };
  
  const toggleWeek = (key: string) => {
    setOpenWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkDone = (uid: string) => {
      const p = ProgressService.loadProgress();
      const current = p[uid] || {};
      
      const isNowDone = !current.done;
      
      const newItem = { 
        ...current, 
        done: isNowDone, 
        inProgress: false, 
        ts: Date.now() 
      };

      if (!isNowDone) {
        delete newItem.reps;
      }
      
      p[uid] = newItem;

      ProgressService.saveProgress(p);
      onUpdateProgress(p);
  };

  const handleMarkCycleDone = (cycleName: string) => {
    let p = ProgressService.loadProgress();
    workouts.forEach((w) => {
      if (w.cycle === cycleName) {
        const uid = ProgressService.getWorkoutUID(w);
        p[uid] = { done: true, inProgress: false, ts: Date.now() };
      }
    });
    ProgressService.saveProgress(p);
    onUpdateProgress(p);
  }

  const handleResetCycle = (cycleName: string) => {
    let p = ProgressService.loadProgress();
    workouts.forEach((w) => {
      if (w.cycle === cycleName) {
        const uid = ProgressService.getWorkoutUID(w);
        delete p[uid];
      }
    });
    ProgressService.saveProgress(p);
    onUpdateProgress(p);
  }

  return (
    <div className="space-y-6 pb-safe">
      {cycleGroups.map(cycle => {
        const percentComplete = cycle.total > 0 ? Math.round((cycle.doneCount / cycle.total) * 100) : 0;
        const isComplete = percentComplete === 100;

        return (
        <div key={cycle.name} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isComplete ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-900/50 border-gray-800'}`}>
          {/* Cycle Header */}
          <div
            onClick={() => toggleCycle(cycle.name)}
            className="cursor-pointer p-5 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            
            <div className="flex justify-between items-end mb-2 relative z-10">
              <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">History</h3>
                  <span className="text-2xl font-black text-white tracking-tight uppercase">{cycle.name}</span>
              </div>
              <div className="flex items-center gap-2">
                  {isComplete && <TrophyIcon className="w-6 h-6 text-yellow-400 animate-pulse" />}
                  <span className={`text-2xl font-bold ${isComplete ? 'text-accent' : 'text-gray-500'}`}>{percentComplete}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden relative z-10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-gradient-to-r from-green-400 to-accent' : 'bg-accent'}`}
                style={{ width: `${percentComplete}%` }}>
              </div>
            </div>

             <div className="mt-4 flex justify-between items-center relative z-10">
                  <div className="text-xs text-gray-500 font-mono">{cycle.doneCount} / {cycle.total} WORKOUTS COMPLETE</div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleMarkCycleDone(cycle.name); }} className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded uppercase tracking-wide">Complete All</button>
                      <button onClick={(e) => { e.stopPropagation(); handleResetCycle(cycle.name); }} className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded uppercase tracking-wide">Reset</button>
                  </div>
             </div>
          </div>

          {/* Weeks Accordion */}
          <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${openCycles[cycle.name] ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className="p-4 pt-0 space-y-4 border-t border-white/5">
              {cycle.weeks.map(week => {
                  const weekKey = `${cycle.name}|${week.name}`;
                  const isWeekOpen = openWeeks[weekKey] ?? false;
                  const weekPercent = week.total > 0 ? (week.doneCount / week.total) * 100 : 0;
                  
                  return (
                    <div key={weekKey} className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                      <div
                        onClick={() => toggleWeek(weekKey)}
                        className="cursor-pointer p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col">
                             <span className="text-sm font-bold text-gray-300">{week.name}</span>
                             <div className="w-24 bg-gray-800 rounded-full h-1 mt-2">
                                <div className="bg-accent h-1 rounded-full transition-all duration-500" style={{ width: `${weekPercent}%` }}></div>
                             </div>
                        </div>
                         <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isWeekOpen ? 'rotate-180' : ''}`} />
                      </div>

                      <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isWeekOpen ? 'max-h-[600px]' : 'max-h-0'}`}>
                        <div className="px-2 pb-2 space-y-1 bg-black/20">
                          {week.items.map(item => {
                              const uid = ProgressService.getWorkoutUID(item.workout);
                              const pItem = progress[uid] || {};
                              const isSelected = selectedWorkoutIndex === item.index;

                              return (
                                  <div key={item.index} className={`group flex items-center gap-3 p-2 rounded-lg transition-all ${isSelected ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'}`}>
                                      <div 
                                          onClick={() => onSelectWorkout(item.index)} 
                                          className="flex-grow flex items-center gap-3 cursor-pointer"
                                      >
                                          <div className="relative">
                                            <img src={item.workout.exercises[0]?.image || `https://picsum.photos/seed/${item.index}/40/40`} alt={item.workout.day} className="w-12 h-12 rounded-lg object-cover bg-gray-800 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all" />
                                            {pItem.done && <div className="absolute inset-0 bg-green-500/30 rounded-lg flex items-center justify-center"><CheckIcon className="w-6 h-6 text-white drop-shadow-md" /></div>}
                                          </div>
                                          <div className="flex flex-col">
                                              <span className={`font-bold text-sm ${pItem.done ? 'text-gray-400 line-through decoration-accent' : 'text-off-white'}`}>{item.workout.day}</span>
                                              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{item.workout.exercises.length} Exercises • {item.workout.timing}</span>
                                          </div>
                                      </div>
                                      
                                      <button 
                                          onClick={() => handleMarkDone(uid)} 
                                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${pItem.done ? 'bg-accent border-accent shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'border-gray-600 hover:border-gray-400'}`}
                                          aria-label={`Mark done`}
                                      >
                                          {pItem.done && <CheckIcon className="w-4 h-4 text-black" />}
                                      </button>
                                  </div>
                              );
                          })}
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        </div>
      )})}
    </div>
  );
};
