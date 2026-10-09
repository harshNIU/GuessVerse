import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Flame, Zap, CheckCircle2 } from 'lucide-react';
import { FinalResultsData } from '../../shared/types.ts';
import { sound } from '../services/sound.ts';

interface FinalLeaderboardProps {
  finalResults: FinalResultsData;
  currentUserId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onNewRoom: () => void;
}

export const FinalLeaderboard: React.FC<FinalLeaderboardProps> = ({
  finalResults,
  currentUserId,
  isHost,
  onPlayAgain,
  onNewRoom,
}) => {
  useEffect(() => {
    sound.playVictory();

    // Confetti celebration cannons
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#fbbf24', '#e11d48', '#a855f7'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#fbbf24', '#e11d48', '#a855f7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const winner = finalResults.winner;
  const isWinner = winner.id === currentUserId;

  const getRankBadge = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `${idx + 1}.`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Winner Spotlight Crown */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-8 flex flex-col items-center"
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-radial from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-[0_0_50px_rgba(251,191,36,0.6)] mb-4 animate-bounce">
          <Trophy className="w-12 h-12 md:w-14 md:h-14 fill-current" />
        </div>

        <span className="text-xs md:text-sm uppercase tracking-widest font-black text-amber-400 mb-1">
          🏆 BOLLYWOOD CHAMPION 🏆
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel text-white tracking-wider drop-shadow-xl">
          {winner.name}
        </h1>

        <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-amber-300 tabular-nums">
          {winner.score.toLocaleString()} POINTS
        </div>

        {isWinner && (
          <p className="mt-2 text-sm text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-4 py-1.5 rounded-full">
            🎉 That's you! You are the ultimate Bollywood maestro!
          </p>
        )}
      </motion.div>

      {/* Final Scoreboard Table */}
      <div className="w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl mb-8 space-y-2.5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>FINAL LEADERBOARD</span>
          <span>SCORE</span>
        </div>

        {finalResults.leaderboard.map((p, idx) => {
          const isMe = p.id === currentUserId;
          return (
            <motion.div
              key={p.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                idx === 0
                  ? 'bg-amber-500/20 border border-amber-500/50 shadow-lg'
                  : isMe
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/5 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono">{getRankBadge(idx)}</span>
                <span className="text-2xl">{p.avatar}</span>
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                        CHAMPION
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {p.correctAnswersCount} correct answers · Best streak: {p.longestStreak}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl md:text-2xl font-black font-mono text-white tabular-nums">
                  {p.score}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trivia Highlights & Stats */}
      {finalResults.stats && (
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {finalResults.stats.fastestGuesser && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col items-center text-center">
              <Zap className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Fastest Response
              </span>
              <span className="text-sm font-bold text-white mt-1">
                {finalResults.stats.fastestGuesser.name}
              </span>
              <span className="text-xs text-amber-300 font-mono">
                {finalResults.stats.fastestGuesser.timeSeconds}s
              </span>
            </div>
          )}

          {finalResults.stats.longestStreakHolder && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col items-center text-center">
              <Flame className="w-5 h-5 text-amber-500 mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Longest Streak
              </span>
              <span className="text-sm font-bold text-white mt-1">
                {finalResults.stats.longestStreakHolder.name}
              </span>
              <span className="text-xs text-amber-300 font-mono">
                🔥 {finalResults.stats.longestStreakHolder.streak} in a row
              </span>
            </div>
          )}

          {finalResults.stats.highestAccuracy && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col items-center text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Accuracy Leader
              </span>
              <span className="text-sm font-bold text-white mt-1">
                {finalResults.stats.highestAccuracy.name}
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                {finalResults.stats.highestAccuracy.percentage}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Replay Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        {isHost ? (
          <button
            onClick={onPlayAgain}
            className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
        ) : (
          <div className="flex-1 w-full p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center text-xs text-slate-400 font-medium">
            Waiting for host to replay...
          </div>
        )}

        <button
          onClick={onNewRoom}
          className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider border border-white/15 hover:border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>NEW ROOM</span>
        </button>
      </div>
    </div>
  );
};
