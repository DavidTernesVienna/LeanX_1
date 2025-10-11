
import React, { useState, useMemo } from 'react';
import type { Workout, Progress, CycleGroup, WorkoutItem } from '../types';
import * as ProgressService from '../services/progressService';
import { CheckIcon } from './icons';

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
    <div className="space-y-4">
      {cycleGroups.map(cycle => (
        <div key={cycle.name} className="bg-gray-dark rounded-xl overflow-hidden">
          <div
            onClick={() => toggleCycle(cycle.name)}
            className="cursor-pointer p-4"
            role="button"
            aria-expanded={openCycles[cycle.name] ?? false}
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCycle(cycle.name)}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">{cycle.name}</span>
              <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleMarkCycleDone(cycle.name); }} className="text-xs bg-gray-light px-2 py-1 rounded">✓ all</button>
                  <button onClick={(e) => { e.stopPropagation(); handleResetCycle(cycle.name); }} className="text-xs bg-gray-light px-2 py-1 rounded">↺</button>
                  </div>
                  <span className="text-xs text-gray-text">{cycle.doneCount}/{cycle.total} done</span>
              </div>
            </div>
            <div className="w-full bg-gray-light rounded-full h-1.5 mt-2">
              <div 
                className="bg-accent h-1.5 rounded-full transition-all duration-500" 
                style={{ width: cycle.total > 0 ? `${(cycle.doneCount / cycle.total) * 100}%` : '0%' }}>
              </div>
            </div>
          </div>
          <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${openCycles[cycle.name] ? 'max-h-[1500px]' : 'max-h-0'}`}>
            <div className="p-4 pt-0 space-y-3">
              {cycle.weeks.map(week => {
                  const weekKey = `${cycle.name}|${week.name}`;
                  const isWeekOpen = openWeeks[weekKey] ?? false;
                  return (
                    <div key={weekKey} className="bg-gray-light/30 rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleWeek(weekKey)}
                        className="cursor-pointer p-3"
                        role="button"
                        aria-expanded={isWeekOpen}
                        tabIndex={0}
                        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && toggleWeek(weekKey)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold text-gray-text">{week.name}</div>
                          <div className="text-xs text-gray-text">{week.doneCount}/{week.total}</div>
                        </div>
                        <div className="w-full bg-gray-dark rounded-full h-1 mt-1">
                            <div 
                              className="bg-accent h-1 rounded-full transition-all duration-500" 
                              style={{ width: week.total > 0 ? `${(week.doneCount / week.total) * 100}%` : '0%' }}>
                            </div>
                        </div>
                      </div>
                      <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isWeekOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                        <div className="px-2 pb-2 space-y-1">
                          {week.items.map(item => {
                              const uid = ProgressService.getWorkoutUID(item.workout);
                              const pItem = progress[uid] || {};
                              const isSelected = selectedWorkoutIndex === item.index;

                              return (
                                  <div key={item.index} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isSelected ? 'bg-accent/20' : 'hover:bg-gray-light/50'}`}>
                                      <div 
                                          onClick={() => onSelectWorkout(item.index)} 
                                          className="flex-grow flex items-center gap-3 cursor-pointer"
                                      >
                                          <img src={item.workout.exercises[0]?.image || `https://picsum.photos/seed/${item.index}/40/40`} alt={item.workout.day} className="w-10 h-10 rounded-md object-cover bg-gray-light flex-shrink-0" />
                                          <span className="font-medium text-off-white">{item.workout.day}</span>
                                      </div>
                                      <button 
                                          onClick={() => handleMarkDone(uid)} 
                                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${pItem.done ? 'bg-green-500 border-green-500' : 'border-gray-light hover:border-gray-text'}`}
                                          aria-label={`Mark ${item.workout.day} as ${pItem.done ? 'not done' : 'done'}`}
                                      >
                                          {pItem.done && <CheckIcon className="w-4 h-4 text-white" />}
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
      ))}
    </div>
  );
};
