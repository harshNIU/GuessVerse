import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Users, Trophy, Play, Film, MessageSquare, Eye, UserCheck, X, Database } from 'lucide-react';
import { ContentStudioModal } from './ContentStudioModal.tsx';

interface LandingScreenProps {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  isConnecting?: boolean;
  errorMessage?: string;
}

const AVATAR_OPTIONS = ['🎬', '🕶️', '👑', '💃', '🦁', '⭐', '🍿', '🏆'];

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isConnecting = false,
  errorMessage = '',
}) => {
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [formError, setFormError] = useState('');
  const [invitedFromUrl, setInvitedFromUrl] = useState(false);

  React.useEffect(() => {
    // Check if user followed a shared link with ?room=CODE, ?code=CODE, /room/CODE or #room=CODE
    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get('room') || params.get('code') || params.get('join');
    if (queryRoom) {
      setRoomCode(queryRoom.trim().toUpperCase());
      setModalMode('join');
      setInvitedFromUrl(true);
      return;
    }

    // Check hash route e.g. /#room=CODE or /#CODE
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(cleanHash);
      const hashRoom = hashParams.get('room') || hashParams.get('code') || cleanHash;
      if (hashRoom && hashRoom.length >= 4 && hashRoom.length <= 8) {
        setRoomCode(hashRoom.trim().toUpperCase());
        setModalMode('join');
        setInvitedFromUrl(true);
        return;
      }
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && (pathParts[0] === 'room' || pathParts[0] === 'join')) {
      setRoomCode(pathParts[1].trim().toUpperCase());
      setModalMode('join');
      setInvitedFromUrl(true);
    }
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormError('');
  };

  const handleOpenJoin = () => {
    setModalMode('join');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setFormError('Please enter your name');
      return;
    }

    if (modalMode === 'create') {
      onCreateRoom(playerName.trim(), selectedAvatar);
    } else if (modalMode === 'join') {
      if (!roomCode.trim() || roomCode.trim().length < 4) {
        setFormError('Please enter a valid 5-character room code');
        return;
      }
      onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim(), selectedAvatar);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0914] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30">
      {/* Hero Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col items-center">
        {/* Banner Artwork Container with measured scrim */}
        <div className="relative w-full max-w-4xl h-56 sm:h-72 md:h-96 rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-950/40 mb-8 md:mb-10 group">
          <img
            src="/src/assets/images/guessverse_hero_banner_1791495464014.jpg"
            alt="GuessVerse Cinema Aesthetics"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Measured gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0914] via-[#0b0914]/60 to-transparent" />

          {/* Banner Hero Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end p-6 md:p-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Multiplayer Guessing Universe</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cinzel tracking-wider text-white drop-shadow-lg mb-1">
              GUESSVERSE
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-300 font-cinzel tracking-wide mb-2 drop-shadow-md">
              Nobody Guesses It Better..
            </p>

            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl text-balance">
              Test your cinema knowledge with friends across 4 thrilling rounds: Movie Frames, Iconic Dialogues, Silhouettes & Celebrity Eyes!
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="w-full max-w-md mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md mb-14">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <button
              onClick={handleOpenCreate}
              disabled={isConnecting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black text-base tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span>CREATE ROOM</span>
            </button>

            <button
              onClick={handleOpenJoin}
              disabled={isConnecting}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base tracking-wide border border-white/15 hover:border-amber-400/40 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <Users className="w-5 h-5 text-amber-400" />
              <span>JOIN ROOM</span>
            </button>
          </div>

          <button
            onClick={() => setShowStudioModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-emerald-500/35 hover:border-emerald-400/60 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Upload Celebrity Photos & Custom Content Studio</span>
          </button>
        </div>

        {/* 4 Rounds Showcase Bento */}
        <section className="w-full max-w-5xl mb-14">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold font-cinzel text-white">
              THE 4 GUESSING ROUNDS
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Every round tests your Bollywood fandom in a completely different way
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Frames */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-amber-400/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Round 1: Movie Frame
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identify legendary Bollywood blockbusters from a single cinematic shot. Speed is king!
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
                Up to 1000 Points
              </div>
            </div>

            {/* Card 2: Dialogues */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-yellow-400/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-3">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Round 2: Iconic Dialogue
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Mogambo khush hua", "I am Iron Man", "Winter is Coming" — guess movies & shows behind immortal punchlines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-yellow-300 font-semibold uppercase tracking-wider">
                Typographic Spotlight
              </div>
            </div>

            {/* Card 3: Silhouettes */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-purple-400/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Round 3: Actress Silhouette
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Who is she?" Recognize top Bollywood heroines solely from their iconic dance pose & stance.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                15s Dramatic Reveal
              </div>
            </div>

            {/* Card 4: Eyes */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-emerald-400/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Round 4: Celebrity Eyes
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Whose eyes?" Identify the star from a tight macro crop of their gaze before full face reveal!
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
                Expanding Face Reveal
              </div>
            </div>
          </div>
        </section>

        {/* How to Play Rules */}
        <section className="w-full max-w-4xl p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-white/10 mb-8">
          <h2 className="text-lg md:text-xl font-bold font-cinzel text-amber-300 mb-4">
            HOW TO PLAY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-white mb-1">1. Create or Join</p>
              <p className="text-slate-400 text-xs">
                Host generates a 5-letter room code (e.g. B7K9X). Up to 6 friends can join simultaneously.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">2. Race the Clock</p>
              <p className="text-slate-400 text-xs">
                You have 15 seconds per question. First correct answer takes 1000 points; speed determines rank!
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">3. Streak to Victory</p>
              <p className="text-slate-400 text-xs">
                Rack up consecutive correct answers for 🔥 streak multipliers and claim the Bollywood Trophy!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        Bollywood Guess · The 100% Indian Cinema Multiplayer Trivia Experience
      </footer>

      {/* Modal for Create / Join */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#131124] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setModalMode(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold font-cinzel text-white">
                  {modalMode === 'create'
                    ? 'CREATE A ROOM'
                    : invitedFromUrl
                    ? `JOIN ROOM ${roomCode}`
                    : 'JOIN A ROOM'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {modalMode === 'create'
                    ? 'Start a private lobby and invite up to 5 friends'
                    : invitedFromUrl
                    ? 'You were invited! Choose a name and avatar to jump in.'
                    : 'Enter the room code shared by your host'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {modalMode === 'join' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1.5">
                      Room Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. B7K9X"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/15 focus:border-amber-400 focus:outline-none text-center font-mono font-bold text-lg tracking-widest text-white uppercase placeholder:text-slate-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1.5">
                    Your Player Name
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="e.g. Rahul, Simran, Bunny..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/15 focus:border-amber-400 focus:outline-none text-white placeholder:text-slate-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1.5">
                    Choose Your Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-amber-500/20 border-2 border-amber-400 scale-105'
                            : 'bg-slate-900 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-400 text-center font-medium">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-extrabold text-sm tracking-wide hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isConnecting
                    ? 'CONNECTING...'
                    : modalMode === 'create'
                    ? 'CREATE LOBBY'
                    : 'JOIN GAME'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bollywood Studio & Image Uploader Modal */}
      <ContentStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
      />
    </div>
  );
};
