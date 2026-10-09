import React, { useState } from 'react';
import { Pause, Play, SkipForward, StopCircle, Crown, ChevronUp, ChevronDown } from 'lucide-react';

interface HostControlsProps {
  isPaused: boolean;
  onHostAction: (action: 'pause' | 'resume' | 'skip' | 'end_game') => void;
}

export const HostControls: React.FC<HostControlsProps> = ({ isPaused, onHostAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 p-3 rounded-2xl bg-slate-950/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Crown className="w-3.5 h-3.5" />
            <span>Host Controls</span>
          </div>

          <button
            onClick={() => onHostAction(isPaused ? 'resume' : 'pause')}
            className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume Timer' : 'Pause Timer'}</span>
          </button>

          <button
            onClick={() => onHostAction('skip')}
            className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5 text-blue-400" />
            <span>Skip Question</span>
          </button>

          <button
            onClick={() => onHostAction('end_game')}
            className="w-full px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <StopCircle className="w-3.5 h-3.5 text-red-400" />
            <span>End Game</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider flex items-center gap-2 shadow-xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
      >
        <Crown className="w-3.5 h-3.5" />
        <span>HOST TOOLS</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
