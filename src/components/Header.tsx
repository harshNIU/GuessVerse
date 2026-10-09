import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check } from 'lucide-react';
import { sound } from '../services/sound.ts';
import { RoomState } from '../../shared/types.ts';

interface HeaderProps {
  roomState: RoomState | null;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomState, onLeaveRoom }) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const copyCode = () => {
    if (!roomState?.roomCode) return;
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b0914]/85 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex flex-col hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <span className="text-lg md:text-xl font-black font-cinzel tracking-wider bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
              GUESSVERSE
            </span>
            <span className="text-[9px] text-amber-300/80 font-medium tracking-widest uppercase -mt-0.5">
              Nobody Guesses It Better..
            </span>
          </a>
        </div>

        {/* Zone 2: Active Room / Round metadata (unboxed, clean typography) */}
        {roomState && (
          <div className="hidden sm:flex items-center gap-3 text-xs md:text-sm text-slate-300 font-medium">
            <button
              onClick={copyCode}
              title="Click to copy room code"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-mono font-bold tracking-widest transition-colors cursor-pointer"
            >
              <span>{roomState.roomCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              )}
            </button>

            <span aria-hidden="true" className="text-white/20">·</span>

            {roomState.status === 'LOBBY' ? (
              <span className="text-slate-400">
                Lobby ({roomState.players.length}/{roomState.maxPlayers})
              </span>
            ) : (
              <span className="text-amber-400/90 font-semibold">
                Round {roomState.currentRound} of 4
              </span>
            )}
          </div>
        )}

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title={isMuted ? 'Sound Muted' : 'Sound On'}
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {roomState && onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
