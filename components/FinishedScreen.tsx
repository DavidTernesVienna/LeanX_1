

import React, { useEffect, useRef } from 'react';
import { FireIcon, TrophyIcon, CheckIcon } from './icons';

interface FinishedScreenProps {
  onLogReps: () => void;
  onContinue: () => void;
  earnedXp: number;
  isLevelUp: boolean;
  streak: number;
}

// Simple particle system without external deps
const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: {x: number, y: number, vx: number, vy: number, color: string, size: number}[] = [];
        const colors = ['#4ade80', '#f59e0b', '#3b82f6', '#ffffff'];

        for(let i=0; i<100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 5 + 2
            });
        }

        let animationId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity
                p.size *= 0.99; // shrink

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if(p.size < 0.5 || p.y > canvas.height) {
                     particles.splice(index, 1);
                }
            });

            if(particles.length > 0) {
                animationId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

export const FinishedScreen: React.FC<FinishedScreenProps> = ({ onLogReps, onContinue, earnedXp, isLevelUp, streak }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <Confetti />
      
      <div className="relative z-10 w-full max-w-sm">
          
          {/* Victory Header */}
          <div className="mb-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(74,222,128,0.5)]">
                  <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white italic tracking-wider uppercase">Workout<br/><span className="text-accent text-5xl">Crushed!</span></h1>
          </div>

          {/* Stats Card */}
          <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-2xl mb-8 animate-[fade-in_0.5s_ease-out_0.3s_both]">
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 bg-gray-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">XP Earned</span>
                      <div className="flex items-center gap-2">
                          <TrophyIcon className="w-6 h-6 text-yellow-400" />
                          <span className="text-3xl font-bold text-white">+{earnedXp}</span>
                      </div>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-900/50 rounded-xl border border-white/5">
                      <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Streak</span>
                      <div className="flex items-center gap-2">
                          <FireIcon className="w-6 h-6 text-orange-500" />
                          <span className="text-3xl font-bold text-white">{streak}</span>
                      </div>
                  </div>
              </div>
              
              {isLevelUp && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold tracking-wider shadow-lg animate-pulse">
                      LEVEL UP!
                  </div>
              )}
          </div>

          {/* Actions */}
          <div className="space-y-4 animate-[fade-in_0.5s_ease-out_0.6s_both]">
            <button
              onClick={onLogReps}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95 border border-gray-600"
            >
              Log Reps
            </button>
            <button
              onClick={onContinue}
              className="w-full bg-accent hover:bg-green-400 text-black font-black py-4 rounded-xl text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
            >
              FINISH
            </button>
          </div>
      </div>
    </div>
  );
};