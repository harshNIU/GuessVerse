import React from 'react';
import { Player } from '../../shared/types.ts';
import { Flame, CheckCircle2 } from 'lucide-react';

interface CompactLeaderboardProps {
  players: Player[];
  currentUserId: string;
}

export const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({
  players,
  currentUserId,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}.`;
  };

  return (
    <div className="w-full max-w-xs bg-slate-900/70 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>SCOREBOARD</span>
        <span>PTS</span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((p, idx) => {
          const isMe = p.id === currentUserId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                isMe
                  ? 'bg-amber-500/15 border border-amber-500/30 font-bold text-amber-200'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 text-center font-mono">{getRankBadge(idx)}</span>
                <span className="text-sm">{p.avatar}</span>
                <span className="truncate max-w-[100px]">{p.name}</span>

                {p.streak >= 2 && (
                  <span className="inline-flex items-center text-[10px] text-amber-400 font-extrabold ml-1">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-500 inline" />
                    x{p.streak}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                {p.hasAnsweredCurrent && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-bold text-white">{p.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
