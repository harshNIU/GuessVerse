import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Film, MessageSquare, UserCheck, Eye, Sparkles } from 'lucide-react';
import { RoundType } from '../../shared/types.ts';
import { sound } from '../services/sound.ts';

interface RoundIntroProps {
  round: RoundType;
  countdownNumber?: number; // 3, 2, 1
}

const ROUND_DETAILS = {
  1: {
    title: 'ROUND 1',
    subtitle: 'GUESS THE MOVIE FROM THE FRAME',
    description: 'A cinematic movie frame will be revealed. Type the movie title as fast as you can!',
    icon: Film,
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/40',
  },
  2: {
    title: 'ROUND 2',
    subtitle: 'GUESS THE MOVIE FROM THE DIALOGUE',
    description: 'An immortal Bollywood dialogue will be spotlighted. Name the movie it belongs to!',
    icon: MessageSquare,
    color: 'from-yellow-500 to-amber-600',
    borderColor: 'border-yellow-500/40',
  },
  3: {
    title: 'ROUND 3',
    subtitle: 'WHO IS SHE? (ACTRESS SILHOUETTE)',
    description: 'A stylized silhouette will appear. Identify the Bollywood queen before time runs out!',
    icon: UserCheck,
    color: 'from-fuchsia-500 to-purple-600',
    borderColor: 'border-purple-500/40',
  },
  4: {
    title: 'ROUND 4',
    subtitle: 'WHOSE EYES? (CELEBRITY EYES)',
    description: 'A macro crop of celebrity eyes will be shown. Name the superstar before the full face reveals!',
    icon: Eye,
    color: 'from-emerald-400 to-teal-600',
    borderColor: 'border-emerald-500/40',
  },
};

export const RoundIntro: React.FC<RoundIntroProps> = ({ round, countdownNumber }) => {
  const details = ROUND_DETAILS[round] || ROUND_DETAILS[1];
  const Icon = details.icon;

  useEffect(() => {
    sound.playRoundStart();
  }, [round]);

  if (countdownNumber !== undefined && countdownNumber > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0914] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        {/* Ambient background rays */}
        <div className="absolute inset-0 bg-radial from-amber-600/20 via-transparent to-transparent blur-3xl pointer-events-none" />

        <p className="text-sm md:text-base uppercase tracking-widest text-amber-400 font-bold mb-2">
          GET READY...
        </p>
        <h2 className="text-2xl md:text-4xl font-black font-cinzel text-white mb-8 tracking-wider">
          BOLLYWOOD GUESS
        </h2>

        <motion.div
          key={countdownNumber}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-36 h-36 md:w-48 md:h-48 rounded-full border-4 border-amber-400/80 bg-radial from-amber-500/20 to-black/80 flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.5)]"
        >
          <span className="text-6xl md:text-8xl font-black font-cinzel text-amber-300">
            {countdownNumber}
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0914] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Cinematic Spotlight backdrop */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-purple-950/20 to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full flex flex-col items-center relative z-10"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-300 mb-6 shadow-2xl backdrop-blur-md">
          <Icon className="w-8 h-8 md:w-10 md:h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-amber-300 uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{details.title}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-cinzel text-white tracking-wider mb-4 text-balance drop-shadow-md">
          {details.subtitle}
        </h1>

        <p className="text-sm md:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
          {details.description}
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs text-amber-400/80 font-mono tracking-widest">
          <span>STARTING IN A MOMENT...</span>
        </div>
      </motion.div>
    </div>
  );
};
