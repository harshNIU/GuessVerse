/**
 * Shared types for Bollywood Guess Multiplayer Game
 */

export type RoundType = 1 | 2 | 3 | 4;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface GameSettings {
  selectedRounds: RoundType[]; // Which rounds to play (min 2, e.g. [1, 4] or [1, 2, 3, 4])
  framesCount: number;         // 3 to 20
  dialoguesCount: number;      // 3 to 20
  silhouettesCount: number;    // 3 to 20
  eyesCount: number;           // 3 to 20
  difficulty: Difficulty;
  questionTimerSeconds: number; // default 15
}

export interface Player {
  id: string;
  socketId: string;
  sessionId?: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  isBot?: boolean;
  score: number;
  roundScore: number;
  streak: number;
  longestStreak: number;
  correctAnswersCount: number;
  fastestAnswerTimeMs?: number;
  hasAnsweredCurrent: boolean;
  isCurrentAnswerCorrect?: boolean;
  currentAnswerScore?: number;
  currentAnswerRank?: number; // 1st, 2nd, etc.
}

export type RoomStatus =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'ROUND_INTRO'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_REVEAL'
  | 'ROUND_SUMMARY'
  | 'FINAL_RESULTS';

export interface MovieFrameQuestion {
  id: string;
  title: string;
  aliases: string[];
  year: number;
  director: string;
  actors: string[];
  frameUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  clue?: string;
}

export interface DialogueQuestion {
  id: string;
  movie: string;
  aliases: string[];
  dialogue: string;
  englishMeaning?: string;
  character?: string;
  actor?: string;
  year: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SilhouetteQuestion {
  id: string;
  celebrity: string;
  aliases: string[];
  silhouetteSvgUrl?: string;
  originalImageUrl: string;
  poseDescription: string;
  iconicMovieOrSong: string;
  triviaFact?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  silhouettePathData?: string;
}

export interface EyesQuestion {
  id: string;
  celebrity: string;
  aliases: string[];
  eyesCropUrl: string;
  fullImageUrl: string;
  gender: 'actor' | 'actress';
  signatureFeature: string;
  iconicMovies: string[];
  triviaFact?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Client-safe Question (answers scrubbed so clients cannot cheat!)
export interface ClientQuestion {
  id: string;
  round: RoundType;
  questionNumber: number;
  totalQuestionsInRound: number;
  totalQuestionsInGame: number;
  overallQuestionNumber: number;
  durationSeconds: number;
  
  // Specific round content
  frameUrl?: string;
  dialogue?: string;
  englishMeaning?: string;
  silhouetteImageUrl?: string;
  poseDescription?: string;
  eyesCropUrl?: string;
  gender?: 'actor' | 'actress';
  clue?: string;
  options?: string[]; // 4 multiple choice choices
}

export interface RevealedAnswer {
  correctAnswer: string;
  triviaFact?: string;
  details: {
    title?: string;
    movie?: string;
    year?: number;
    actors?: string[];
    director?: string;
    character?: string;
    celebrity?: string;
    poseDescription?: string;
    iconicMovieOrSong?: string;
    fullImageUrl?: string;
    signatureFeature?: string;
  };
  answersRace: {
    playerId: string;
    playerName: string;
    avatar: string;
    points: number;
    timeSeconds: number;
    rank: number;
    streak: number;
  }[];
}

export interface RoundSummaryData {
  round: RoundType;
  roundTitle: string;
  nextRound?: RoundType;
  leaderboard: {
    playerId: string;
    name: string;
    avatar: string;
    score: number;
    roundGain: number;
    streak: number;
  }[];
}

export interface FinalResultsData {
  winner: Player;
  leaderboard: Player[];
  stats: {
    totalQuestions: number;
    fastestGuesser?: { name: string; timeSeconds: number; question: string };
    longestStreakHolder?: { name: string; streak: number };
    highestAccuracy?: { name: string; percentage: number };
  };
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  status: RoomStatus;
  settings: GameSettings;
  currentRound: RoundType;
  currentQuestionIndex: number;
  totalQuestionsInCurrentRound: number;
  activeQuestion?: ClientQuestion;
  revealedAnswer?: RevealedAnswer;
  roundSummary?: RoundSummaryData;
  finalResults?: FinalResultsData;
  timerSecondsRemaining: number;
  isPaused: boolean;
  startingCountdown?: number;
}
