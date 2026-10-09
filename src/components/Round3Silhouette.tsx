import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, UserCheck, Zap } from 'lucide-react';
import { ClientQuestion, Player } from '../../shared/types.ts';
import { CinematicVisual } from './CinematicVisual.tsx';
import { QuestionTimer } from './QuestionTimer.tsx';
import { CompactLeaderboard } from './CompactLeaderboard.tsx';

interface Round3SilhouetteProps {
  question: ClientQuestion;
  timerRemaining: number;
  players: Player[];
  currentUserId: string;
  hasAnswered: boolean;
  myAnswerResult?: { isCorrect: boolean; points: number; rank?: number; message?: string } | null;
  onSubmitAnswer: (answer: string) => void;
}

export const Round3Silhouette: React.FC<Round3SilhouetteProps> = ({
  question,
  timerRemaining,
  players,
  currentUserId,
  hasAnswered,
  myAnswerResult,
  onSubmitAnswer,
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [question.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || hasAnswered) return;
    onSubmitAnswer(inputVal.trim());
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col items-center">
      {/* Top Status Bar: Question Progress & Timer */}
      <div className="w-full flex items-center justify-between mb-4 max-w-4xl">
        <div>
          <span className="text-xs uppercase tracking-widest text-fuchsia-400 font-bold">
            ROUND 3 · BOLLYWOOD QUEEN SILHOUETTE
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
            Challenge {question.questionNumber} of {question.totalQuestionsInRound}
          </h2>
        </div>

        <QuestionTimer
          secondsRemaining={timerRemaining}
          totalDuration={question.durationSeconds}
        />
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Silhouette Visual */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="text-center mb-3">
            <h1 className="text-2xl sm:text-3xl font-black font-cinzel text-white tracking-widest">
              WHO IS SHE?
            </h1>
            <p className="text-xs text-purple-300 font-medium">
              Guess the Bollywood actress from her iconic stance & silhouette!
            </p>
          </div>

          <CinematicVisual
            type="silhouette"
            id={question.id}
            imageUrl={question.silhouetteImageUrl}
            frameDescription={question.poseDescription}
          />

          {/* Submission Input Box */}
          <div className="w-full max-w-xl mt-6">
            {!hasAnswered ? (
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  placeholder="Type actress name (e.g. Deepika, Alia, Kareena)..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full py-3.5 pl-4 pr-24 rounded-2xl bg-slate-900/90 border border-purple-500/30 focus:border-fuchsia-400 focus:outline-none text-white text-base shadow-xl placeholder:text-slate-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT</span>
                </button>
              </form>
            ) : (
              <div
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                  myAnswerResult?.isCorrect
                    ? 'bg-fuchsia-950/70 border-fuchsia-500/50 text-fuchsia-200'
                    : 'bg-slate-900/80 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm md:text-base">
                  {myAnswerResult?.isCorrect ? (
                    <>
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span>{myAnswerResult.message || 'Actress Identified!'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      <span>Guess Locked In — Awaiting Full Reveal!</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Full image and identity reveals at 0 seconds!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side Leaderboard */}
        <div className="w-full lg:w-auto flex justify-center">
          <CompactLeaderboard players={players} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
};
