import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Share2, Crown, Settings2, Play, Users, Sparkles, UserPlus, Database } from 'lucide-react';
import { RoomState, GameSettings } from '../../shared/types.ts';
import { ContentStudioModal } from './ContentStudioModal.tsx';

interface LobbyScreenProps {
  roomState: RoomState;
  currentUserId: string;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onAddTestPlayer?: () => void;
  onRemoveTestPlayer?: (botId: string) => void;
}

const QUESTION_COUNT_OPTIONS = [3, 5, 7, 10, 15];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomState,
  currentUserId,
  onUpdateSettings,
  onStartGame,
  onAddTestPlayer,
  onRemoveTestPlayer,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);

  const isHost = roomState.hostId === currentUserId;
  const canStart = roomState.players.length >= 2;

  const totalQuestions =
    roomState.settings.framesCount +
    roomState.settings.dialoguesCount +
    roomState.settings.silhouettesCount +
    roomState.settings.eyesCount;

  const getShareUrl = () => {
    return `${window.location.origin}/?room=${roomState.roomCode}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareCode = () => {
    const url = getShareUrl();
    if (navigator.share) {
      navigator.share({
        title: 'Join my Bollywood Guess Lobby!',
        text: `Play Bollywood Guess with me! Room code: ${roomState.roomCode}`,
        url: url,
      }).catch(() => copyInviteLink());
    } else {
      copyInviteLink();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0914] text-slate-100 flex flex-col items-center justify-between p-4 md:p-8">
      <div className="max-w-4xl w-full flex flex-col items-center">
        {/* Title */}
        <div className="text-center mt-2 mb-6">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            MULTIPLAYER LOBBY
          </p>
          <h1 className="text-3xl md:text-5xl font-black font-cinzel text-white tracking-wider">
            BOLLYWOOD GUESS
          </h1>
        </div>

        {/* Room Code Card */}
        <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-md shadow-2xl flex flex-col items-center text-center mb-8">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">
            ROOM CODE
          </span>
          <div className="text-4xl md:text-5xl font-black font-mono tracking-widest text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-4">
            {roomState.roomCode}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <button
              onClick={copyCode}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'CODE COPIED!' : 'COPY CODE'}</span>
            </button>

            <button
              onClick={copyInviteLink}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedLink ? 'LINK COPIED!' : 'COPY LINK'}</span>
            </button>

            <button
              onClick={shareCode}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400/80 mt-3 max-w-xs text-balance">
            Share code <span className="font-mono text-amber-300 font-bold">{roomState.roomCode}</span> or link with friends.
          </p>
        </div>

        {/* Players Card Header */}
        <div className="w-full max-w-2xl mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span>
              PLAYERS ({roomState.players.length}/{roomState.maxPlayers})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStudioModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-medium text-emerald-300 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Upload Photos / Studio</span>
            </button>

            {isHost && (
              <button
                onClick={() => setShowSettingsModal(!showSettingsModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-amber-300 transition-colors cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Host Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Players Grid (Up to 6) */}
        <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          {roomState.players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                player.id === currentUserId
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/60 border-white/10'
              }`}
            >
              {player.isHost && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>HOST</span>
                </div>
              )}

              {player.isBot && isHost && onRemoveTestPlayer && (
                <button
                  onClick={() => onRemoveTestPlayer(player.id)}
                  title="Remove bot"
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-950/80 border border-red-500/30 text-red-300 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                >
                  ×
                </button>
              )}

              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-3xl mb-2.5 shadow-inner">
                {player.avatar}
              </div>

              <div className="text-sm font-bold text-white truncate max-w-[130px]">
                {player.name}
              </div>

              <div
                className={`text-[11px] font-medium mt-0.5 ${
                  !player.isConnected
                    ? 'text-amber-400 animate-pulse'
                    : player.isBot
                    ? 'text-purple-300'
                    : 'text-emerald-400'
                }`}
              >
                {!player.isConnected
                  ? 'Reconnecting...'
                  : player.isBot
                  ? 'Virtual Player'
                  : 'Ready'}
              </div>
            </motion.div>
          ))}

          {/* Empty Player Slots */}
          {Array.from({ length: Math.max(0, 6 - roomState.players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center text-center min-h-[120px]"
            >
              <div className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center text-slate-600 mb-2">
                <Users className="w-5 h-5 opacity-40" />
              </div>
              <span className="text-xs text-slate-500">Waiting...</span>
            </div>
          ))}
        </div>

        {/* Quick Test Friend Button (Helps single testers verify multiplayer game flow immediately) */}
        {isHost && roomState.players.length < 6 && onAddTestPlayer && (
          <button
            onClick={onAddTestPlayer}
            className="mb-6 px-4 py-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Test Friend (Simulate 2nd player)</span>
          </button>
        )}

        {/* Host Settings Panel (Visible inline or expanded) */}
        {isHost && (
          <div className="w-full max-w-2xl p-5 md:p-6 rounded-3xl bg-slate-900/50 border border-white/10 mb-8 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold font-cinzel text-amber-300 uppercase tracking-wider">
                ROUND CONFIGURATION
              </h3>
              <span className="text-xs text-slate-300 font-semibold bg-white/5 px-2.5 py-1 rounded-md">
                Total Questions: {totalQuestions}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Round 1 Settings */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Round 1: Movie Frames
                </label>
                <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-white/5">
                  {QUESTION_COUNT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ framesCount: num })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        roomState.settings.framesCount === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Round 2 Settings */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Round 2: Dialogues
                </label>
                <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-white/5">
                  {QUESTION_COUNT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ dialoguesCount: num })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        roomState.settings.dialoguesCount === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Round 3 Settings */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Round 3: Silhouettes
                </label>
                <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-white/5">
                  {QUESTION_COUNT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ silhouettesCount: num })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        roomState.settings.silhouettesCount === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Round 4 Settings */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Round 4: Celebrity Eyes
                </label>
                <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-white/5">
                  {QUESTION_COUNT_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ eyesCount: num })}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        roomState.settings.eyesCount === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Trivia Difficulty
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard', 'mixed'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onUpdateSettings({ difficulty: diff })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                      roomState.settings.difficulty === diff
                        ? 'bg-white text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Start Game Action */}
        <div className="w-full max-w-md flex flex-col items-center">
          {isHost ? (
            <>
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full py-4 px-6 rounded-2xl font-black text-base tracking-wider transition-all flex items-center justify-center gap-3 shadow-xl ${
                  canStart
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-98 shadow-amber-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START GAME</span>
              </button>

              {!canStart && (
                <p className="text-xs text-amber-400/80 font-medium mt-3 text-center">
                  Waiting for at least 1 more player to join (2–6 players required)...
                </p>
              )}
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-center w-full">
              <p className="text-sm text-slate-300 font-semibold animate-pulse">
                Waiting for host to start the game...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bollywood Content Studio & Image Uploader Modal */}
      <ContentStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
      />
    </div>
  );
};
