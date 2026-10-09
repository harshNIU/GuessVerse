import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Sparkles, Eye, User, Image as ImageIcon } from 'lucide-react';

interface CinematicVisualProps {
  type: 'frame' | 'silhouette' | 'eyes';
  id?: string;
  imageUrl?: string;
  celebrity?: string;
  gender?: 'actor' | 'actress';
  isRevealed?: boolean;
  revealData?: any;
  frameDescription?: string;
  clue?: string;
}

// Helper to determine if a URL is a real image (custom upload, data URI, or external link)
function isRealImage(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
}

export const CinematicVisual: React.FC<CinematicVisualProps> = ({
  type,
  id = '',
  imageUrl,
  celebrity,
  gender,
  isRevealed = false,
  revealData,
  frameDescription,
  clue,
}) => {
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [id, imageUrl]);

  // =========================================================================
  // 1. ROUND 1: MOVIE FRAME
  // =========================================================================
  if (type === 'frame') {
    const hasImage = isRealImage(imageUrl) && !imageError;

    return (
      <div className="relative w-full aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-slate-900 via-neutral-950 to-slate-950 shadow-2xl shadow-amber-950/30 group">
        {/* Film reel sprockets decoration on edges */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/75 flex justify-between px-3 items-center z-20 border-b border-white/5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2 bg-neutral-700/80 rounded-xs" />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/75 flex justify-between px-3 items-center z-20 border-t border-white/5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2 bg-neutral-700/80 rounded-xs" />
          ))}
        </div>

        {hasImage ? (
          <div className="relative w-full h-full flex items-center justify-center pt-4 pb-4">
            <img
              src={imageUrl}
              alt="Movie Frame"
              className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
              onError={() => setImageError(true)}
            />
            {clue && (
              <div className="absolute bottom-6 left-6 z-20 inline-flex items-center gap-2 text-xs text-amber-300 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Clue: {clue}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 pt-8 pb-8">
            <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
              <div className="absolute -inset-10 bg-radial from-amber-600/20 via-red-950/20 to-transparent blur-2xl" />

              <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                  <Film className="w-8 h-8 animate-pulse" />
                </div>

                <div className="px-5 py-3 rounded-xl bg-slate-950/85 border border-amber-500/20 backdrop-blur-md shadow-2xl">
                  <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold mb-1.5">
                    CINEMATIC SCENE DEPICTION
                  </p>
                  <p className="text-sm md:text-base text-slate-100 font-medium italic leading-relaxed">
                    "{frameDescription || 'An iconic sequence from a celebrated Bollywood masterpiece.'}"
                  </p>
                </div>

                {clue && (
                  <div className="inline-flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clue: {clue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/10 to-black/70" />
      </div>
    );
  }

  // =========================================================================
  // 2. ROUND 3: ACTRESS SILHOUETTE CHALLENGE
  // =========================================================================
  if (type === 'silhouette') {
    const hasCustomImage = isRealImage(imageUrl) && !imageError;
    const revealImg = revealData?.details?.fullImageUrl || revealData?.details?.originalImageUrl;
    const hasRevealImage = isRealImage(revealImg);

    return (
      <div className="relative w-full aspect-4/3 max-w-md mx-auto rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-b from-[#180d2d] via-[#0d071a] to-[#070310] shadow-2xl shadow-purple-950/50 flex items-center justify-center">
        {/* Dramatic Backlight Spotlight */}
        <div className="absolute inset-0 bg-radial from-fuchsia-600/30 via-purple-900/20 to-transparent blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="silhouette"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex flex-col items-center justify-between p-5"
            >
              {/* Backlit Glow Halo */}
              <div className="relative flex-1 w-full flex items-center justify-center">
                <div className="absolute w-52 h-64 bg-radial from-amber-400/40 via-fuchsia-500/35 to-transparent blur-2xl rounded-full animate-pulse-subtle" />

                {hasCustomImage ? (
                  /* User-uploaded silhouette image */
                  <div className="relative z-10 w-full h-56 flex items-center justify-center p-2">
                    <img
                      src={imageUrl}
                      alt="Actress Silhouette"
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_15px_rgba(232,121,249,0.7)] brightness-0 contrast-200"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  /* Stylized Recognized Silhouette Vectors tailored by celebrity pose */
                  <div className="relative z-10 w-48 h-64 flex items-center justify-center">
                    <ActressSilhouetteArt id={id} />
                  </div>
                )}
              </div>

              {/* Pose description clue */}
              <div className="w-full mt-2 px-4 py-2 rounded-2xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-md text-center shadow-xl">
                <p className="text-xs text-purple-200 font-medium leading-snug">
                  {frameDescription || 'Identify the Bollywood actress from her iconic pose!'}
                </p>
              </div>
            </motion.div>
          ) : (
            /* Reveal State */
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-3">
                <div className="absolute -inset-4 bg-radial from-amber-400/50 via-purple-500/30 to-transparent blur-xl rounded-full" />
                {hasRevealImage ? (
                  <img
                    src={revealImg}
                    alt={revealData?.correctAnswer}
                    className="relative w-36 h-36 rounded-full object-cover object-top border-4 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)]"
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-purple-900 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                    <User className="w-16 h-16 text-amber-200" />
                  </div>
                )}
              </div>

              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-950/70 border border-amber-500/40 px-3 py-1 rounded-full mb-1">
                BOLLYWOOD QUEEN REVEALED
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-cinzel tracking-wider drop-shadow-lg">
                {revealData?.correctAnswer}
              </h3>
              <p className="text-xs sm:text-sm text-purple-300 font-medium mt-1">
                {revealData?.details?.iconicMovieOrSong || 'Iconic Leading Lady'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // 3. ROUND 4: CELEBRITY EYES CHALLENGE
  // =========================================================================
  if (type === 'eyes') {
    const hasCustomCrop = isRealImage(imageUrl) && !imageError;
    const revealImg = revealData?.details?.fullImageUrl;
    const hasRevealImage = isRealImage(revealImg);

    return (
      <div className="relative w-full aspect-16/8 max-w-2xl mx-auto rounded-3xl overflow-hidden border border-emerald-500/40 bg-gradient-to-b from-[#061815] via-[#020b0a] to-black shadow-2xl shadow-emerald-950/40 flex items-center justify-center">
        {/* Cinematic Spotlight backdrop */}
        <div className="absolute inset-0 bg-radial from-emerald-500/20 via-teal-950/25 to-black blur-2xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="eyes-crop"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex flex-col items-center justify-between p-4 md:p-6"
            >
              {/* Viewfinder Target Framing Overlay */}
              <div className="relative w-full max-w-lg h-36 md:h-40 rounded-2xl border border-emerald-400/50 bg-black/90 flex items-center justify-center overflow-hidden shadow-2xl">
                {/* Viewfinder Corner Reticles */}
                <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-emerald-400 z-20" />
                <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-emerald-400 z-20" />
                <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-emerald-400 z-20" />
                <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-emerald-400 z-20" />

                {/* Subtle Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-20">
                  <div className="w-full h-px bg-emerald-400" />
                  <div className="h-full w-px bg-emerald-400 absolute" />
                </div>

                {hasCustomCrop ? (
                  /* Real User-Uploaded / Custom Cropped Photo */
                  <img
                    src={imageUrl}
                    alt="Celebrity Eyes Crop"
                    className="w-full h-full object-cover object-center filter contrast-110 brightness-95"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  /* High-Fidelity Celebrity Recognized Vector Art */
                  <CelebrityEyesVectorArt id={id} gender={gender} />
                )}

                <div className="absolute bottom-1.5 right-3 text-[10px] uppercase font-mono tracking-wider text-emerald-400/80 bg-black/60 px-2 py-0.5 rounded-sm z-20">
                  MACRO CROP // GAZE TARGET
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Notice the distinctive gaze, brow arch, and signature eye color!</span>
              </div>
            </motion.div>
          ) : (
            /* Reveal State */
            <motion.div
              key="eyes-reveal"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex flex-col items-center justify-center p-5 text-center"
            >
              <div className="relative mb-2.5">
                <div className="absolute -inset-4 bg-radial from-emerald-400/40 via-teal-500/20 to-transparent blur-xl rounded-full" />
                {hasRevealImage ? (
                  <img
                    src={revealImg}
                    alt={revealData?.correctAnswer}
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover object-top border-4 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.6)]"
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-full border-4 border-emerald-400 bg-radial from-emerald-400/20 to-teal-950 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                    <User className="w-12 h-12 text-emerald-200" />
                  </div>
                )}
              </div>

              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-0.5 rounded-full mb-1">
                SUPERSTAR REVEALED
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel tracking-wider drop-shadow-md">
                {revealData?.correctAnswer}
              </h3>
              <p className="text-xs text-emerald-300 font-medium mt-1 max-w-md px-2">
                {revealData?.details?.signatureFeature || 'Iconic Bollywood Superstar'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

// =========================================================================
// CELEBRITY-SPECIFIC RECOGNIZABLE EYES ARTWORK
// =========================================================================
function CelebrityEyesVectorArt({ id, gender }: { id: string; gender?: string }) {
  // 1. Shah Rukh Khan (srk / eyes_001) - Distinctive furrowed romantic gaze, intense dark brown iris, signature brow arch
  if (id.includes('srk') || id === 'eyes_001') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24 text-amber-200">
        {/* Furrow center brow wrinkles */}
        <path d="M 156,22 Q 160,32 158,40" stroke="#f59e0b" strokeWidth="2.5" fill="none" opacity="0.8" />
        <path d="M 164,22 Q 160,32 162,40" stroke="#f59e0b" strokeWidth="2.5" fill="none" opacity="0.8" />
        {/* Left Brow - Expressive arched masculine brow */}
        <path d="M 40,32 Q 95,14 150,26" stroke="#d97706" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        {/* Left Eye */}
        <path d="M 48,46 Q 95,28 142,46 Q 95,62 48,46 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
        <circle cx="95" cy="45" r="8.5" fill="#78350f" />
        <circle cx="95" cy="45" r="4.5" fill="#020617" />
        <circle cx="97" cy="43" r="2" fill="#ffffff" />
        {/* Romantic crinkle under left eye */}
        <path d="M 60,56 Q 95,66 130,56" stroke="#92400e" strokeWidth="1.5" fill="none" opacity="0.6" />

        {/* Right Brow */}
        <path d="M 170,26 Q 225,14 280,32" stroke="#d97706" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        {/* Right Eye */}
        <path d="M 178,46 Q 225,28 272,46 Q 225,62 178,46 Z" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
        <circle cx="225" cy="45" r="8.5" fill="#78350f" />
        <circle cx="225" cy="45" r="4.5" fill="#020617" />
        <circle cx="227" cy="43" r="2" fill="#ffffff" />
        {/* Romantic crinkle under right eye */}
        <path d="M 190,56 Q 225,66 260,56" stroke="#92400e" strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    );
  }

  // 2. Amitabh Bachchan (amitabh / eyes_002) - Iconic thick spectacles frames with authoritative penetrating eyes
  if (id.includes('amitabh') || id === 'eyes_002') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24">
        {/* Distinguished Horn-rimmed Spectacles Bridge */}
        <path d="M 148,42 Q 160,34 172,42" stroke="#e2e8f0" strokeWidth="4" fill="none" />
        {/* Left Lens Frame */}
        <rect x="42" y="22" width="105" height="52" rx="14" fill="#020617" stroke="#94a3b8" strokeWidth="4" />
        {/* Right Lens Frame */}
        <rect x="173" y="22" width="105" height="52" rx="14" fill="#020617" stroke="#94a3b8" strokeWidth="4" />

        {/* Left Brow (distinguished graying) */}
        <path d="M 50,18 Q 95,8 140,20" stroke="#cbd5e1" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Left Eye */}
        <ellipse cx="94" cy="48" rx="28" ry="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        <circle cx="94" cy="48" r="8" fill="#451a03" />
        <circle cx="94" cy="48" r="4" fill="#000000" />
        <circle cx="96" cy="46" r="1.5" fill="#ffffff" />

        {/* Right Brow */}
        <path d="M 180,20 Q 225,8 270,18" stroke="#cbd5e1" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Right Eye */}
        <ellipse cx="226" cy="48" rx="28" ry="14" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        <circle cx="226" cy="48" r="8" fill="#451a03" />
        <circle cx="226" cy="48" r="4" fill="#000000" />
        <circle cx="228" cy="46" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  // 3. Aishwarya Rai Bachchan (aishwarya / eyes_003) - Luminous sea-green/hazel almond eyes, delicate winged eyeliner
  if (id.includes('aishwarya') || id === 'eyes_003') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24">
        {/* Left Brow - Graceful sculpted arch */}
        <path d="M 45,30 Q 95,12 145,26" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Left Eye - Winged liner */}
        <path d="M 38,44 Q 95,22 140,42 Q 95,64 38,44 Z" fill="#0f172a" stroke="#059669" strokeWidth="2.5" />
        {/* Wing tip */}
        <path d="M 38,44 L 28,38" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        {/* Sea-green Hazel Iris */}
        <circle cx="94" cy="43" r="10" fill="#10b981" />
        <circle cx="94" cy="43" r="7" fill="#34d399" />
        <circle cx="94" cy="43" r="4" fill="#022c22" />
        <circle cx="97" cy="40" r="2.5" fill="#ffffff" />

        {/* Right Brow */}
        <path d="M 175,26 Q 225,12 275,30" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Right Eye */}
        <path d="M 180,42 Q 225,22 282,44 Q 225,64 180,42 Z" fill="#0f172a" stroke="#059669" strokeWidth="2.5" />
        {/* Wing tip */}
        <path d="M 282,44 L 292,38" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        {/* Sea-green Hazel Iris */}
        <circle cx="226" cy="43" r="10" fill="#10b981" />
        <circle cx="226" cy="43" r="7" fill="#34d399" />
        <circle cx="226" cy="43" r="4" fill="#022c22" />
        <circle cx="229" cy="40" r="2.5" fill="#ffffff" />
      </svg>
    );
  }

  // 4. Hrithik Roshan (hrithik / eyes_004) - Striking translucent green-hazel "Greek God" gaze, sharp angular brow bone
  if (id.includes('hrithik') || id === 'eyes_004') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24">
        {/* Left Brow - Sharp defined angular brow */}
        <path d="M 45,34 L 100,20 L 148,28" stroke="#b45309" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Left Eye */}
        <path d="M 52,45 Q 98,30 144,45 Q 98,59 52,45 Z" fill="#091b18" stroke="#2dd4bf" strokeWidth="2.5" />
        <circle cx="98" cy="44" r="9" fill="#14b8a6" />
        <circle cx="98" cy="44" r="6" fill="#5eead4" />
        <circle cx="98" cy="44" r="3.5" fill="#042f2c" />
        <circle cx="100" cy="42" r="2" fill="#ffffff" />

        {/* Right Brow */}
        <path d="M 172,28 L 220,20 L 275,34" stroke="#b45309" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Right Eye */}
        <path d="M 176,45 Q 222,30 268,45 Q 222,59 176,45 Z" fill="#091b18" stroke="#2dd4bf" strokeWidth="2.5" />
        <circle cx="222" cy="44" r="9" fill="#14b8a6" />
        <circle cx="222" cy="44" r="6" fill="#5eead4" />
        <circle cx="222" cy="44" r="3.5" fill="#042f2c" />
        <circle cx="224" cy="42" r="2" fill="#ffffff" />
      </svg>
    );
  }

  // 5. Deepika Padukone (deepika / eyes_005) - Doe eyes with signature bold winged kohl eyeliner
  if (id.includes('deepika') || id === 'eyes_005') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24">
        {/* Left Brow */}
        <path d="M 40,28 Q 92,10 144,24" stroke="#451a03" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Dramatic Winged Liner */}
        <path d="M 28,34 Q 45,46 142,44 Q 92,66 38,46 Z" fill="#020617" stroke="#e11d48" strokeWidth="2" />
        <circle cx="92" cy="44" r="9.5" fill="#78350f" />
        <circle cx="92" cy="44" r="5" fill="#000000" />
        <circle cx="95" cy="41" r="2" fill="#ffffff" />

        {/* Right Brow */}
        <path d="M 176,24 Q 228,10 280,28" stroke="#451a03" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Right Winged Liner */}
        <path d="M 178,44 Q 275,46 292,34 Q 282,46 228,66 Z" fill="#020617" stroke="#e11d48" strokeWidth="2" />
        <circle cx="228" cy="44" r="9.5" fill="#78350f" />
        <circle cx="228" cy="44" r="5" fill="#000000" />
        <circle cx="231" cy="41" r="2" fill="#ffffff" />
      </svg>
    );
  }

  // 6. Salman Khan (salman / eyes_007) - Heavy-lidded hooded gaze, thick masculine brow
  if (id.includes('salman') || id === 'eyes_007') {
    return (
      <svg viewBox="0 0 320 90" className="w-80 h-24">
        {/* Heavy Straight Thick Brow */}
        <path d="M 40,30 L 145,28" stroke="#1e293b" strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* Heavy Hooded Upper Lid */}
        <path d="M 48,36 Q 95,30 142,36" stroke="#475569" strokeWidth="3" fill="none" />
        <path d="M 48,46 Q 95,36 142,46 Q 95,58 48,46 Z" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="95" cy="46" r="8" fill="#451a03" />
        <circle cx="95" cy="46" r="4" fill="#000000" />
        <circle cx="97" cy="44" r="1.5" fill="#ffffff" />

        {/* Right Brow */}
        <path d="M 175,28 L 280,30" stroke="#1e293b" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M 178,36 Q 225,30 272,36" stroke="#475569" strokeWidth="3" fill="none" />
        <path d="M 178,46 Q 225,36 272,46 Q 225,58 178,46 Z" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="225" cy="46" r="8" fill="#451a03" />
        <circle cx="225" cy="46" r="4" fill="#000000" />
        <circle cx="227" cy="44" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  // Default recognizable Bollywood eyes vector
  return (
    <svg viewBox="0 0 320 90" className="w-80 h-24 text-emerald-400">
      <path d="M 45,30 Q 95,14 145,26" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M 50,44 Q 95,26 140,44 Q 95,60 50,44 Z" fill="#0f172a" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="95" cy="43" r="8.5" fill="#10b981" />
      <circle cx="95" cy="43" r="4.5" fill="#020617" />
      <circle cx="98" cy="40" r="2" fill="#ffffff" />

      <path d="M 175,26 Q 225,14 275,30" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M 180,44 Q 225,26 270,44 Q 225,60 180,44 Z" fill="#0f172a" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="225" cy="43" r="8.5" fill="#10b981" />
      <circle cx="225" cy="43" r="4.5" fill="#020617" />
      <circle cx="228" cy="40" r="2" fill="#ffffff" />
    </svg>
  );
}

// =========================================================================
// ACTRESS-SPECIFIC RECOGNIZABLE SILHOUETTE ARTWORK
// =========================================================================
function ActressSilhouetteArt({ id }: { id: string }) {
  // 1. Deepika Padukone (Deewani Mastani / Om Shanti Om - Regal Kathak Mudra & Anarkali)
  if (id.includes('deepika') || id === 'sil_001') {
    return (
      <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-pink-400/60 stroke-1 drop-shadow-[0_0_15px_rgba(244,114,182,0.8)]">
        {/* Head with high royal tiara/jhoomar bun */}
        <circle cx="100" cy="40" r="14" />
        <path d="M 94,22 Q 100,14 106,22 Z" />
        {/* Slender neck & regal torso */}
        <path d="M 95,54 L 105,54 L 110,95 L 90,95 Z" />
        {/* Left Arm raised in classical Deewani Mastani Mudra */}
        <path d="M 90,65 Q 60,45 55,25 Q 52,22 55,20 Q 62,24 68,45 L 88,72 Z" />
        {/* Right Arm arched outward with delicate hand mudra */}
        <path d="M 110,65 Q 140,80 155,105 Q 160,110 156,114 Q 148,110 135,95 L 112,78 Z" />
        {/* Flared Royal Anarkali Lehenga / Ghagra */}
        <path d="M 90,95 Q 50,160 20,260 Q 100,278 180,260 Q 150,160 110,95 Z" />
        {/* Flowing sheer dupatta trail billowing behind */}
        <path d="M 55,40 Q 20,110 15,220 Q 35,210 50,120 Z" opacity="0.85" />
      </svg>
    );
  }

  // 2. Alia Bhatt (Gangubai Kathiawadi - Signature Folded Hands Backward Namaste)
  if (id.includes('alia') || id === 'sil_002') {
    return (
      <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-purple-400/60 stroke-1 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]">
        {/* Head with tight center-parted sleek bun & rose flower outline */}
        <circle cx="100" cy="42" r="15" />
        <circle cx="100" cy="24" r="7" />
        {/* Confident stance torso */}
        <path d="M 93,57 L 107,57 L 114,110 L 86,110 Z" />
        {/* Folded Hands Backward Namaste gesture (elbows flared wide behind back) */}
        <path d="M 90,68 Q 62,85 58,115 Q 64,120 74,108 L 88,88 Z" />
        <path d="M 110,68 Q 138,85 142,115 Q 136,120 126,108 L 112,88 Z" />
        {/* Signature crisp pleated white border saree draping */}
        <path d="M 86,110 Q 75,180 65,265 Q 100,270 135,265 Q 125,180 114,110 Z" />
        {/* Saree Pallu wrapped firmly around shoulder */}
        <path d="M 88,72 Q 70,120 62,190 Q 72,185 82,130 Z" />
      </svg>
    );
  }

  // 3. Madhuri Dixit (Ek Do Teen / Dola Re - Famous Kathak Mudra held beside cheek)
  if (id.includes('madhuri') || id === 'sil_005') {
    return (
      <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-amber-400/60 stroke-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
        {/* Head with ornate traditional dance jewelry & hair braid */}
        <circle cx="100" cy="40" r="14" />
        {/* Left hand held beside face in iconic Kathak Mudra */}
        <path d="M 88,65 Q 68,60 70,38 Q 74,32 78,38 L 86,55 Z" />
        {/* Right arm graceful semi-circle */}
        <path d="M 112,65 Q 150,90 145,130 Q 140,132 134,122 L 115,85 Z" />
        {/* Torso & blouse */}
        <path d="M 92,54 L 108,54 L 115,100 L 85,100 Z" />
        {/* Grand twirling Ghagra lehenga flare */}
        <path d="M 85,100 Q 40,170 15,265 Q 100,280 185,265 Q 160,170 115,100 Z" />
        <path d="M 30,130 Q 10,210 20,265 Q 35,260 45,180 Z" opacity="0.75" />
      </svg>
    );
  }

  // 4. Kareena Kapoor Khan (Jab We Met / Mauja Hi Mauja - Open arms wide celebratory stance)
  if (id.includes('kareena') || id === 'sil_003') {
    return (
      <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-fuchsia-400/60 stroke-1 drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]">
        {/* Head with high bouncy ponytail */}
        <circle cx="100" cy="42" r="14" />
        <path d="M 88,38 Q 72,25 65,35 Q 75,48 90,44 Z" />
        {/* Torso */}
        <path d="M 94,56 L 106,56 L 112,110 L 88,110 Z" />
        {/* Arms thrown wide open in exuberant joy */}
        <path d="M 90,65 Q 50,45 25,35 Q 22,40 30,48 L 88,80 Z" />
        <path d="M 110,65 Q 150,45 175,35 Q 178,40 170,48 L 112,80 Z" />
        {/* Flowing Patiala Salwar Kameez */}
        <path d="M 88,110 Q 60,170 50,265 Q 100,270 150,265 Q 140,170 112,110 Z" />
        {/* Dupatta fluttering in wind */}
        <path d="M 90,75 Q 40,105 20,165 Q 30,165 65,115 Z" opacity="0.8" />
        <path d="M 110,75 Q 160,105 180,165 Q 170,165 135,115 Z" opacity="0.8" />
      </svg>
    );
  }

  // 5. Priyanka Chopra (Desi Girl - Metallic Saree Hip Cocked Stance)
  if (id.includes('priyanka') || id === 'sil_004') {
    return (
      <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-amber-300/60 stroke-1 drop-shadow-[0_0_15px_rgba(252,211,77,0.8)]">
        {/* Head tilted back in glam celebration */}
        <circle cx="104" cy="38" r="14" />
        {/* Cascading long waves hair */}
        <path d="M 92,42 Q 78,70 82,105 L 94,95 Z" />
        {/* S-curve hourglass stance */}
        <path d="M 98,52 L 110,52 L 118,95 L 92,95 Z" />
        {/* Hand resting on cocked hip */}
        <path d="M 92,62 Q 70,80 68,110 L 78,112 Q 85,92 94,76 Z" />
        {/* Hand in the air celebrating */}
        <path d="M 110,62 Q 135,40 148,15 L 142,12 Q 125,38 108,70 Z" />
        {/* Slender fitting metallic saree silhouette with slit */}
        <path d="M 92,95 Q 115,140 105,265 Q 118,268 135,265 Q 138,150 118,95 Z" />
      </svg>
    );
  }

  // Default recognizable Bollywood dancer silhouette
  return (
    <svg viewBox="0 0 200 280" className="w-full h-full fill-black stroke-pink-400/60 stroke-1 drop-shadow-[0_0_12px_rgba(244,114,182,0.6)]">
      <circle cx="100" cy="45" r="15" />
      <path d="M 85,45 Q 75,75 80,105 L 90,95 Z" />
      <path d="M 115,45 Q 125,75 120,105 L 110,95 Z" />
      <path d="M 94,60 L 106,60 L 112,110 L 88,110 Z" />
      <path d="M 88,70 Q 55,95 45,130 L 55,135 Q 70,105 90,82 Z" />
      <path d="M 112,70 Q 145,95 155,130 L 145,135 Q 130,105 110,82 Z" />
      <path d="M 88,110 Q 50,180 30,265 Q 100,278 170,265 Q 150,180 112,110 Z" />
    </svg>
  );
}
