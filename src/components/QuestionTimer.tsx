import React, { useEffect } from 'react';
import { sound } from '../services/sound.ts';

interface QuestionTimerProps {
  secondsRemaining: number;
  totalDuration?: number;
}

export const QuestionTimer: React.FC<QuestionTimerProps> = ({
  secondsRemaining,
  totalDuration = 15,
}) => {
  const isUrgent = secondsRemaining <= 5;
  const isCritical = secondsRemaining <= 3;

  useEffect(() => {
    if (secondsRemaining > 0 && secondsRemaining <= 10) {
      sound.playTick(secondsRemaining);
    }
  }, [secondsRemaining]);

  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-mono font-black text-xl md:text-2xl transition-all border ${
          isCritical
            ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
            : isUrgent
            ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
            : 'bg-slate-900/90 border-white/15 text-white shadow-lg'
        }`}
      >
        <span>{secondsRemaining}</span>
      </div>
      
      {/* Mini Progress Bar */}
      <div className="w-20 md:w-24 h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isCritical ? 'bg-red-500' : isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
