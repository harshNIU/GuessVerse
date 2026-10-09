import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Zap, Flame, Award, Film, User } from 'lucide-react';
import { RevealedAnswer, RoundType } from '../../shared/types.ts';
import { sound } from '../services/sound.ts';
import { CinematicVisual } from './CinematicVisual.tsx';

interface RevealScreenProps {
  round: RoundType;
  revealedAnswer: RevealedAnswer;
  currentUserId: string;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  round,
  revealedAnswer,
  currentUserId,
}) => {
  useEffect(() => {
    sound.playReveal();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const details = revealedAnswer.details;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 flex flex-col items-center">
      {/* Question Reveal Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-6 w-full"
      >
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
          CORRECT ANSWER
        </span>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cinzel text-white tracking-wider mt-3 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
          {revealedAnswer.correctAnswer}
        </h1>

        {/* Reveal Details Badge Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs md:text-sm text-slate-300">
          {details.year && (
            <span className="text-amber-400 font-bold font-mono">
              Released: {details.year}
            </span>
          )}
          {details.director && (
            <>
              <span className="text-white/20">·</span>
              <span>Directed by {details.director}</span>
            </>
          )}
          {details.character && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-amber-300">Character: {details.character}</span>
            </>
          )}
          {details.actors && details.actors.length > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-slate-400">Starring: {details.actors.slice(0, 3).join(', ')}</span>
            </>
          )}
          {details.iconicMovieOrSong && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-amber-300">Famous for: {details.iconicMovieOrSong}</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Visual Component in Revealed State for Frames, Silhouettes & Eyes */}
      {(round === 1 || round === 3 || round === 4) && (
        <div className="w-full mb-6">
          <CinematicVisual
            type={round === 1 ? 'frame' : round === 3 ? 'silhouette' : 'eyes'}
            isRevealed={true}
            revealData={revealedAnswer}
            imageUrl={revealedAnswer.details?.fullImageUrl}
            frameDescription={revealedAnswer.details?.title}
          />
        </div>
      )}

      {/* Speed Race Leaderboard for this Question */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 p-5 md:p-6 backdrop-blur-md shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Zap className="w-4 h-4" />
            <span>FASTEST GUESSERS</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {revealedAnswer.answersRace.length} correct
          </span>
        </div>

        {revealedAnswer.answersRace.length > 0 ? (
          <div className="space-y-2">
            {revealedAnswer.answersRace.map((race, idx) => {
              const isMe = race.playerId === currentUserId;
              return (
                <div
                  key={race.playerId}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                    idx === 0
                      ? 'bg-amber-500/15 border border-amber-500/40 shadow-lg shadow-amber-950/20'
                      : isMe
                      ? 'bg-white/10 border border-white/20 font-semibold'
                      : 'bg-white/5 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono">{getRankBadge(race.rank)}</span>
                    <span className="text-xl">{race.avatar}</span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{race.playerName}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                            FASTEST
                          </span>
                        )}
                        {race.streak >= 2 && (
                          <span className="inline-flex items-center text-[11px] text-amber-400 font-extrabold ml-1">
                            <Flame className="w-3 h-3 fill-amber-400 text-amber-500 inline mr-0.5" />
                            x{race.streak}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {race.timeSeconds.toFixed(2)}s response
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black font-mono text-emerald-400 tabular-nums">
                      +{race.points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-sm">
            <p>No players guessed correctly in time!</p>
            <p className="text-xs text-slate-500 mt-1">Keep going — Bollywood trivia gets intense!</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center text-xs text-slate-400 font-medium">
          <span>Next question starting in a few seconds...</span>
        </div>
      </motion.div>
    </div>
  );
};
