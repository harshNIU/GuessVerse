import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Quote, Zap } from 'lucide-react';
import { ClientQuestion, Player } from '../../shared/types.ts';
import { QuestionTimer } from './QuestionTimer.tsx';
import { CompactLeaderboard } from './CompactLeaderboard.tsx';

interface Round2DialogueProps {
  question: ClientQuestion;
  timerRemaining: number;
  players: Player[];
  currentUserId: string;
  hasAnswered: boolean;
  myAnswerResult?: { isCorrect: boolean; points: number; rank?: number; message?: string } | null;
  onSubmitAnswer: (answer: string) => void;
}

export const Round2Dialogue: React.FC<Round2DialogueProps> = ({
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
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            ROUND 2 · GUESS THE DIALOGUE
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white font-cinzel">
            Dialogue {question.questionNumber} of {question.totalQuestionsInRound}
          </h2>
        </div>

        <QuestionTimer
          secondsRemaining={timerRemaining}
          totalDuration={question.durationSeconds}
        />
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Dialogue Card in Cinematic Spotlight */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="relative w-full aspect-video max-w-3xl rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-[#150f24] via-[#0b0816] to-[#05040a] shadow-2xl shadow-amber-950/20 p-8 flex flex-col items-center justify-center text-center">
            {/* Spotlight Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-radial from-amber-400/20 via-yellow-600/10 to-transparent blur-3xl pointer-events-none" />

            <Quote className="w-10 h-10 md:w-14 md:h-14 text-amber-400/30 mb-4" />

            {/* Cinematic Large Typography */}
            <blockquote className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-wide leading-relaxed font-cinzel max-w-xl text-balance drop-shadow-md">
              "{question.dialogue}"
            </blockquote>

            {question.englishMeaning && (
              <p className="relative z-10 mt-4 text-xs md:text-sm text-amber-200/70 italic max-w-md">
                Meaning: "{question.englishMeaning}"
              </p>
            )}

            <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              <span>Which movie is this from?</span>
            </div>
          </div>

          {/* Submission Input Box */}
          <div className="w-full max-w-xl mt-6">
            {!hasAnswered ? (
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  placeholder="Type the movie title (e.g. Sholay, DDLJ)..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full py-3.5 pl-4 pr-24 rounded-2xl bg-slate-900/90 border border-white/20 focus:border-amber-400 focus:outline-none text-white text-base shadow-xl placeholder:text-slate-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT</span>
                </button>
              </form>
            ) : (
              <div
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                  myAnswerResult?.isCorrect
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-900/80 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm md:text-base">
                  {myAnswerResult?.isCorrect ? (
                    <>
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span>{myAnswerResult.message || 'Dialogue Identified!'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      <span>Answer Submitted — Waiting For Reveal!</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Speed determines your rank on the leaderboard!
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
