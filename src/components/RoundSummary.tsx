import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowRight, Flame } from 'lucide-react';
import { RoundSummaryData } from '../../shared/types.ts';

interface RoundSummaryProps {
  summary: RoundSummaryData;
  currentUserId: string;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({ summary, currentUserId }) => {
  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}.`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <span className="text-xs uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          ROUND COMPLETED
        </span>
        <h1 className="text-3xl md:text-4xl font-black font-cinzel text-white mt-2">
          {summary.roundTitle} Standings
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          {summary.nextRound
            ? `Preparing for Round ${summary.nextRound}...`
            : 'Calculating Final Bollywood Champion!'}
        </p>
      </motion.div>

      {/* Leaderboard Table */}
      <div className="w-full bg-slate-900/80 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md shadow-2xl space-y-2.5">
        {summary.leaderboard.map((item, idx) => {
          const isMe = item.playerId === currentUserId;
          return (
            <motion.div
              key={item.playerId}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                idx === 0
                  ? 'bg-amber-500/20 border border-amber-500/40 shadow-lg'
                  : isMe
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/5 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-mono">{getRankBadge(idx)}</span>
                <span className="text-2xl">{item.avatar}</span>
                <div>
                  <div className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.streak >= 2 && (
                      <span className="inline-flex items-center text-xs text-amber-400 font-extrabold ml-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 inline mr-0.5" />
                        x{item.streak}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">
                    +{item.roundGain} this round
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg md:text-xl font-black font-mono text-white tabular-nums">
                  {item.score}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest">
                  TOTAL PTS
                </span>
              </div>
            </motion.div>
          );
        })}

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <span>Next round starts automatically</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>
    </div>
  );
};
