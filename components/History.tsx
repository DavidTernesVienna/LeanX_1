import React, { useState, useMemo } from 'react';
import type { Workout, Progress, CycleGroup, WorkoutItem } from '../types';
import * as ProgressService from '../services/progressService';

interface HistoryProps {
  workouts: Workout[];
  progress: Progress;
  onSelectWorkout: (index: number) => void;
  onUpdateProgress: (newProgress: Progress) => void;
}

const abbrDay = (day?: string) => day ? String(day).slice(0, 2) : '—';

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
        const doneCount = allItems.filter(item => progress[ProgressService.getWorkoutUID(item.workout, item.index)]?.done).length;
        
        return {
            name: cycleName,
            weeks: Array.from(weekMap.entries()).map(([weekName, items]) => {
                const weekDoneCount = items.filter(item => progress[ProgressService.getWorkoutUID(item.workout, item.index)]?.done).length;
                return {
                    name: weekName,
                    items,
                    total: items.length,
                    doneCount: weekDoneCount,
                };
            }),
            total: allItems.length,
            doneCount: doneCount,
        };
    });
};

const HistorySquare: React.FC<{
  item: WorkoutItem,
  progress: Progress,
  onSelectWorkout: (index: number) => void,
  onMarkDone: (uid: string) => void;
}> = ({ item, progress, onSelectWorkout, onMarkDone }) => {
    const uid = ProgressService.getWorkoutUID(item.workout, item.index);
    const pItem = progress[uid] || {};

    const classes = ['w-6 h-6 rounded-md border transition-colors duration-200'];
    if (pItem.done) classes.push('bg-accent border-accent');
    else if (pItem.inProgress) classes.push('bg-yellow-500 border-yellow-500');
    else classes.push('bg-gray-dark border-gray-light');

    const title = `${item.workout.day || 'Day'} — ${item.workout.week || 'Week'} — ${item.workout.cycle || 'Cycle'}\n${item.workout.timing || ''}`;
    
    return (
        <button
            className={classes.join(' ')}
            title={title}
            onClick={() => onSelectWorkout(item.index)}
            onDoubleClick={(e) => { e.stopPropagation(); onMarkDone(uid); }}
        />
    );
}

export const History: React.FC<HistoryProps> = ({ workouts, progress, onSelectWorkout, onUpdateProgress }) => {
  const [openCycles, setOpenCycles] = useState<Record<string, boolean>>(() => ProgressService.getCollapseState());
  const cycleGroups = useMemo(() => groupWorkouts(workouts, progress), [workouts, progress]);

  const toggleCycle = (name: string) => {
    const newState = { ...openCycles, [name]: !openCycles[name] };
    setOpenCycles(newState);
    ProgressService.setCollapseState(newState);
  };
  
  const handleMarkDone = (uid: string) => {
      const p = ProgressService.loadProgress();
      const current = p[uid] || {};
      p[uid] = { ...current, done: true, inProgress: false, ts: Date.now() };
      ProgressService.saveProgress(p);
      onUpdateProgress(p);
  };

  const handleMarkCycleDone = (cycleName: string) => {
    let p = ProgressService.loadProgress();
    workouts.forEach((w, i) => {
      if (w.cycle === cycleName) {
        const uid = ProgressService.getWorkoutUID(w, i);
        p[uid] = { done: true, inProgress: false, ts: Date.now() };
      }
    });
    ProgressService.saveProgress(p);
    onUpdateProgress(p);
  }

  const handleResetCycle = (cycleName: string) => {
    let p = ProgressService.loadProgress();
    workouts.forEach((w, i) => {
      if (w.cycle === cycleName) {
        const uid = ProgressService.getWorkoutUID(w, i);
        delete p[uid];
      }
    });
    ProgressService.saveProgress(p);
    onUpdateProgress(p);
  }

  return (
    <div className="space-y-4">
      {cycleGroups.map(cycle => (
        <details key={cycle.name} open={openCycles[cycle.name] ?? false} onToggle={(e) => { e.preventDefault(); toggleCycle(cycle.name); }} className="bg-gray-dark rounded-xl overflow-hidden">
          <summary className="list-none cursor-pointer p-4">
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
          </summary>
          <div className="p-4 pt-0 space-y-3">
              {cycle.weeks.map(week => (
                <div key={week.name} className="space-y-2 bg-gray-light/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-semibold text-gray-text">{week.name}</div>
                    <div className="text-xs text-gray-text">{week.doneCount}/{week.total}</div>
                  </div>
                  <div className="w-full bg-gray-dark rounded-full h-1 mb-2">
                      <div 
                        className="bg-accent h-1 rounded-full transition-all duration-500" 
                        style={{ width: week.total > 0 ? `${(week.doneCount / week.total) * 100}%` : '0%' }}>
                      </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {week.items.map(item => (
                      <HistorySquare 
                         key={item.index}
                         item={item}
                         progress={progress}
                         onSelectWorkout={onSelectWorkout}
                         onMarkDone={handleMarkDone}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 text-gray-text text-xs">
                    {week.items.map((item, i) => (
                      <span key={i} title={item.workout.day} className="w-6 text-center">{abbrDay(item.workout.day)}</span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </details>
      ))}
    </div>
  );
};