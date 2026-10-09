import {
  Difficulty,
  GameSettings,
  Player,
  RoomState,
  RoomStatus,
  RoundType,
  ClientQuestion,
  RevealedAnswer,
  RoundSummaryData,
  FinalResultsData,
  MovieFrameQuestion,
  DialogueQuestion,
  SilhouetteQuestion,
  EyesQuestion,
} from '../../shared/types.ts';
import { MOVIE_FRAMES, DIALOGUES, SILHOUETTES, CELEBRITY_EYES } from '../data/questions.ts';
import { contentManager } from '../data/contentManager.ts';
import { calculateScore, checkAnswerCorrectness } from '../utils/scoring.ts';
import { Server as SocketIOServer } from 'socket.io';

interface ActiveRoom {
  code: string;
  hostId: string;
  players: Map<string, Player>;
  settings: GameSettings;
  status: RoomStatus;
  currentRound: RoundType;
  currentQuestionIndex: number;
  timerSecondsRemaining: number;
  timerInterval?: NodeJS.Timeout;
  revealTimeout?: NodeJS.Timeout;
  isPaused: boolean;
  questionStartTimeMs: number;
  
  // Shuffled questions for this session
  questionsR1: MovieFrameQuestion[];
  questionsR2: DialogueQuestion[];
  questionsR3: SilhouetteQuestion[];
  questionsR4: EyesQuestion[];
  
  // Current active private question with secrets
  currentRawQuestion?: MovieFrameQuestion | DialogueQuestion | SilhouetteQuestion | EyesQuestion;
  revealedAnswer?: RevealedAnswer;
  roundSummaryData?: RoundSummaryData;
  finalResultsData?: FinalResultsData;
  
  // Order of correct answers in current question
  currentQuestionAnswers: {
    playerId: string;
    playerName: string;
    avatar: string;
    serverTimestamp: number;
    timeSeconds: number;
    points: number;
    rank: number;
    streak: number;
  }[];
}

interface DisconnectGrace {
  timer: NodeJS.Timeout;
  roomCode: string;
  playerId: string;
}

const DISCONNECT_GRACE_PERIOD_MS = 30000; // 30 seconds to allow seamless reconnection

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>();
  private socketToRoom = new Map<string, string>(); // socketId -> roomCode
  private disconnectGraceTimers = new Map<string, DisconnectGrace>(); // playerId -> timer
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public createRoom(
    hostSocketId: string,
    playerName: string,
    avatar: string,
    sessionId?: string
  ): { roomCode: string; playerId: string; persistentSessionId: string } {
    const roomCode = this.generateRoomCode();
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const persistentSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const hostPlayer: Player = {
      id: playerId,
      sessionId: persistentSessionId,
      socketId: hostSocketId,
      name: playerName.trim() || 'Bollywood Host',
      avatar: avatar || '🎬',
      isHost: true,
      isConnected: true,
      isBot: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      longestStreak: 0,
      correctAnswersCount: 0,
      hasAnsweredCurrent: false,
    };

    const playersMap = new Map<string, Player>();
    playersMap.set(playerId, hostPlayer);

    const initialSettings: GameSettings = {
      framesCount: 5,
      dialoguesCount: 5,
      silhouettesCount: 5,
      eyesCount: 5,
      difficulty: 'mixed',
      questionTimerSeconds: 15,
    };

    const room: ActiveRoom = {
      code: roomCode,
      hostId: playerId,
      players: playersMap,
      settings: initialSettings,
      status: 'LOBBY',
      currentRound: 1,
      currentQuestionIndex: 0,
      timerSecondsRemaining: 15,
      isPaused: false,
      questionStartTimeMs: 0,
      questionsR1: [],
      questionsR2: [],
      questionsR3: [],
      questionsR4: [],
      currentQuestionAnswers: [],
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(hostSocketId, roomCode);

    return { roomCode, playerId, persistentSessionId };
  }

  public joinRoom(
    socketId: string,
    roomCode: string,
    playerName: string,
    avatar: string,
    sessionId?: string
  ): { success: boolean; error?: string; playerId?: string; sessionId?: string } {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room not found. Check the room code!' };
    }

    // Check if player with the same sessionId is already in this room
    if (sessionId) {
      const existingPlayer = Array.from(room.players.values()).find((p) => p.sessionId === sessionId);
      if (existingPlayer) {
        // Cancel any pending disconnect grace timer
        const pending = this.disconnectGraceTimers.get(existingPlayer.id);
        if (pending) {
          clearTimeout(pending.timer);
          this.disconnectGraceTimers.delete(existingPlayer.id);
        }

        // Clean up old socket mapping
        this.socketToRoom.delete(existingPlayer.socketId);

        // Update socket and connection state
        existingPlayer.socketId = socketId;
        existingPlayer.isConnected = true;
        existingPlayer.name = playerName.trim() || existingPlayer.name;
        existingPlayer.avatar = avatar || existingPlayer.avatar;
        this.socketToRoom.set(socketId, cleanCode);

        return { success: true, playerId: existingPlayer.id, sessionId };
      }
    }

    if (room.status !== 'LOBBY') {
      return { success: false, error: 'Game has already started in this room!' };
    }

    if (room.players.size >= 6) {
      return { success: false, error: 'Lobby is full! Maximum 6 players allowed.' };
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newPlayer: Player = {
      id: playerId,
      sessionId: effectiveSessionId,
      socketId,
      name: playerName.trim() || `Player ${room.players.size + 1}`,
      avatar: avatar || '⭐',
      isHost: false,
      isConnected: true,
      isBot: false,
      score: 0,
      roundScore: 0,
      streak: 0,
      longestStreak: 0,
      correctAnswersCount: 0,
      hasAnsweredCurrent: false,
    };

    room.players.set(playerId, newPlayer);
    this.socketToRoom.set(socketId, cleanCode);

    return { success: true, playerId, sessionId: effectiveSessionId };
  }

  public reconnectPlayer(
    socketId: string,
    roomCode: string,
    playerId: string,
    sessionId?: string
  ): { success: boolean; error?: string } {
    const cleanCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { success: false, error: 'Room no longer exists.' };
    }

    const player =
      room.players.get(playerId) ||
      (sessionId ? Array.from(room.players.values()).find((p) => p.sessionId === sessionId) : undefined);

    if (!player) {
      return { success: false, error: 'Player session not found in this room.' };
    }

    // Cancel any pending disconnect timer
    const pending = this.disconnectGraceTimers.get(player.id);
    if (pending) {
      clearTimeout(pending.timer);
      this.disconnectGraceTimers.delete(player.id);
    }

    // Update socket mapping
    this.socketToRoom.delete(player.socketId);
    player.socketId = socketId;
    player.isConnected = true;
    this.socketToRoom.set(socketId, cleanCode);

    this.io.to(cleanCode).emit('player:notification', {
      type: 'reconnect',
      message: `${player.name} reconnected!`,
    });

    return { success: true };
  }

  public leaveRoom(socketId: string): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player) return false;

    // Clear any pending grace timer
    const pending = this.disconnectGraceTimers.get(player.id);
    if (pending) {
      clearTimeout(pending.timer);
      this.disconnectGraceTimers.delete(player.id);
    }

    room.players.delete(player.id);

    if (room.players.size === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.revealTimeout) clearTimeout(room.revealTimeout);
      this.rooms.delete(roomCode);
      return true;
    }

    // Transfer host if host left
    if (player.isHost) {
      const nextHost =
        Array.from(room.players.values()).find((p) => p.isConnected && !p.isBot) ||
        Array.from(room.players.values()).find((p) => !p.isBot) ||
        room.players.values().next().value;
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
        this.io.to(roomCode).emit('player:notification', {
          type: 'host_transfer',
          message: `${nextHost.name} is now the Host!`,
        });
      }
    }

    this.io.to(roomCode).emit('player:notification', {
      type: 'player_left',
      message: `${player.name} left the room.`,
    });

    this.broadcastRoomState(roomCode);
    return true;
  }

  public addTestPlayer(hostSocketId: string): boolean {
    const roomCode = this.socketToRoom.get(hostSocketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'LOBBY') return false;

    const host = Array.from(room.players.values()).find((p) => p.socketId === hostSocketId);
    if (!host || !host.isHost) return false;

    if (room.players.size >= 6) return false;

    const botNames = ['Simran', 'Rahul', 'Kabir', 'Geet', 'Pooja', 'Aman'];
    const botAvatars = ['🍿', '💃', '🕶️', '👑', '🦁', '⭐'];
    const name = botNames[room.players.size % botNames.length] + ' (Bot)';
    const avatar = botAvatars[room.players.size % botAvatars.length];
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const botPlayer: Player = {
      id: botId,
      sessionId: `bot_sess_${botId}`,
      socketId: `bot_sock_${botId}`, // Dedicated virtual socket ID, never conflicts with real sockets!
      name,
      avatar,
      isHost: false,
      isConnected: true,
      isBot: true,
      score: 0,
      roundScore: 0,
      streak: 0,
      longestStreak: 0,
      correctAnswersCount: 0,
      hasAnsweredCurrent: false,
    };

    room.players.set(botId, botPlayer);
    this.broadcastRoomState(roomCode);
    return true;
  }

  public removeTestPlayer(hostSocketId: string, botId: string): boolean {
    const roomCode = this.socketToRoom.get(hostSocketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'LOBBY') return false;

    const host = Array.from(room.players.values()).find((p) => p.socketId === hostSocketId);
    if (!host || !host.isHost) return false;

    if (room.players.has(botId)) {
      room.players.delete(botId);
      this.broadcastRoomState(roomCode);
      return true;
    }
    return false;
  }

  public updateSettings(socketId: string, settings: Partial<GameSettings>): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'LOBBY') return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player || !player.isHost) return false;

    room.settings = { ...room.settings, ...settings };
    this.broadcastRoomState(roomCode);
    return true;
  }

  public startGame(socketId: string): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'LOBBY') return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player || !player.isHost) return false;

    const connectedPlayersCount = Array.from(room.players.values()).filter((p) => p.isConnected).length;
    if (connectedPlayersCount < 2) {
      this.io.to(socketId).emit('game:error', {
        message: 'At least 2 players are needed to start the game!',
      });
      return false;
    }

    // Reset scores & streaks
    for (const p of room.players.values()) {
      p.score = 0;
      p.roundScore = 0;
      p.streak = 0;
      p.longestStreak = 0;
      p.correctAnswersCount = 0;
      p.hasAnsweredCurrent = false;
      p.isCurrentAnswerCorrect = undefined;
      p.currentAnswerScore = undefined;
      p.currentAnswerRank = undefined;
    }

    // Filter and shuffle questions according to settings
    this.prepareQuestions(room);

    room.status = 'COUNTDOWN';
    room.currentRound = 1;
    room.currentQuestionIndex = 0;
    this.broadcastRoomState(roomCode);

    // 3, 2, 1 Countdown transition
    let count = 3;
    const countdownInterval = setInterval(() => {
      this.io.to(roomCode).emit('game:countdown', { count });
      count--;
      if (count < 0) {
        clearInterval(countdownInterval);
        this.startRoundIntro(roomCode, 1);
      }
    }, 1000);

    return true;
  }

  private filterByDifficulty<T extends { difficulty: 'easy' | 'medium' | 'hard' }>(
    list: T[],
    difficulty: Difficulty
  ): T[] {
    if (difficulty === 'mixed') return list;
    const filtered = list.filter((item) => item.difficulty === difficulty);
    return filtered.length >= 3 ? filtered : list;
  }

  private prepareQuestions(room: ActiveRoom) {
    const diff = room.settings.difficulty;
    const customDb = contentManager.getCustomDatabase();

    // Round 1: Movie Frames — prioritize user uploads
    const customFrames = customDb.frames || [];
    const builtinFrames = this.filterByDifficulty(MOVIE_FRAMES, diff);
    const poolR1 = [...this.shuffleArray(customFrames), ...this.shuffleArray(builtinFrames)];
    const countR1 = customFrames.length > 0
      ? Math.max(room.settings.framesCount, Math.min(customFrames.length, 20))
      : room.settings.framesCount;
    room.questionsR1 = poolR1.slice(0, countR1);

    // Round 2: Iconic Dialogues (Bollywood, Marvel, Game of Thrones)
    const customDiag = customDb.dialogues || [];
    const builtinDiag = this.filterByDifficulty(DIALOGUES, diff);
    const poolR2 = [...this.shuffleArray(customDiag), ...this.shuffleArray(builtinDiag)];
    const countR2 = customDiag.length > 0
      ? Math.max(room.settings.dialoguesCount, Math.min(customDiag.length, 20))
      : room.settings.dialoguesCount;
    room.questionsR2 = poolR2.slice(0, countR2);

    // Round 3: Actress Silhouettes — prioritize user uploads
    const customSil = customDb.silhouettes || [];
    const builtinSil = this.filterByDifficulty(SILHOUETTES, diff);
    const poolR3 = [...this.shuffleArray(customSil), ...this.shuffleArray(builtinSil)];
    const countR3 = customSil.length > 0
      ? Math.max(room.settings.silhouettesCount, Math.min(customSil.length, 20))
      : room.settings.silhouettesCount;
    room.questionsR3 = poolR3.slice(0, countR3);

    // Round 4: Celebrity Eyes — prioritize user uploads so every uploaded star is playable!
    const customEyes = customDb.eyes || [];
    const builtinEyes = this.filterByDifficulty(CELEBRITY_EYES, diff);
    const poolR4 = [...this.shuffleArray(customEyes), ...this.shuffleArray(builtinEyes)];
    const countR4 = customEyes.length > 0
      ? Math.max(room.settings.eyesCount, Math.min(customEyes.length, 20))
      : room.settings.eyesCount;
    room.questionsR4 = poolR4.slice(0, countR4);
  }

  private startRoundIntro(roomCode: string, round: RoundType) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.status = 'ROUND_INTRO';
    room.currentRound = round;
    room.currentQuestionIndex = 0;
    room.revealedAnswer = undefined;
    room.roundSummaryData = undefined;

    // Reset round scores for players
    for (const p of room.players.values()) {
      p.roundScore = 0;
    }

    this.broadcastRoomState(roomCode);

    setTimeout(() => {
      this.startNextQuestion(roomCode);
    }, 3500);
  }

  private startNextQuestion(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Clear previous timers
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.revealTimeout) clearTimeout(room.revealTimeout);

    let totalInRound = 0;
    let rawQ: MovieFrameQuestion | DialogueQuestion | SilhouetteQuestion | EyesQuestion | undefined;

    if (room.currentRound === 1) {
      totalInRound = room.questionsR1.length;
      rawQ = room.questionsR1[room.currentQuestionIndex];
    } else if (room.currentRound === 2) {
      totalInRound = room.questionsR2.length;
      rawQ = room.questionsR2[room.currentQuestionIndex];
    } else if (room.currentRound === 3) {
      totalInRound = room.questionsR3.length;
      rawQ = room.questionsR3[room.currentQuestionIndex];
    } else if (room.currentRound === 4) {
      totalInRound = room.questionsR4.length;
      rawQ = room.questionsR4[room.currentQuestionIndex];
    }

    if (!rawQ || room.currentQuestionIndex >= totalInRound) {
      // Round completed! Show round summary
      this.showRoundSummary(roomCode);
      return;
    }

    room.currentRawQuestion = rawQ;
    room.currentQuestionAnswers = [];
    room.revealedAnswer = undefined;
    room.status = 'QUESTION_ACTIVE';
    room.timerSecondsRemaining = room.settings.questionTimerSeconds;
    room.questionStartTimeMs = Date.now();

    // Reset player per-question flags
    for (const p of room.players.values()) {
      p.hasAnsweredCurrent = false;
      p.isCurrentAnswerCorrect = undefined;
      p.currentAnswerScore = undefined;
      p.currentAnswerRank = undefined;
    }

    this.broadcastRoomState(roomCode);

    // Schedule automated virtual bot answers if any bots are in room
    for (const p of room.players.values()) {
      if (p.isBot && p.isConnected) {
        const botId = p.id;
        // Bot responds after 4 - 9 seconds
        const delayMs = Math.floor(Math.random() * 5000) + 4000;
        setTimeout(() => {
          if (room.status === 'QUESTION_ACTIVE' && !room.isPaused) {
            this.handleBotSubmission(roomCode, botId);
          }
        }, delayMs);
      }
    }

    // Start Authoritative Server Countdown
    room.timerInterval = setInterval(() => {
      if (room.isPaused) return;

      room.timerSecondsRemaining--;
      this.io.to(roomCode).emit('game:timer_tick', {
        secondsRemaining: Math.max(0, room.timerSecondsRemaining),
      });

      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.revealCurrentQuestion(roomCode);
      }
    }, 1000);
  }

  private handleBotSubmission(roomCode: string, botId: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'QUESTION_ACTIVE' || room.isPaused) return;

    const bot = room.players.get(botId);
    if (!bot || bot.hasAnsweredCurrent) return;

    const rawQ = room.currentRawQuestion;
    if (!rawQ) return;

    // 70% chance bot gets it correct
    const isCorrect = Math.random() < 0.7;
    const serverNow = Date.now();
    const timeSeconds = Math.max(0.1, Number(((serverNow - room.questionStartTimeMs) / 1000).toFixed(2)));

    bot.hasAnsweredCurrent = true;
    bot.isCurrentAnswerCorrect = isCorrect;

    if (isCorrect) {
      bot.streak++;
      if (bot.streak > bot.longestStreak) bot.longestStreak = bot.streak;
      bot.correctAnswersCount++;

      const rank = room.currentQuestionAnswers.length + 1;
      const scoreObj = calculateScore(rank, bot.streak);
      const points = scoreObj.total;

      bot.score += points;
      bot.roundScore += points;
      bot.currentAnswerScore = points;
      bot.currentAnswerRank = rank;

      room.currentQuestionAnswers.push({
        playerId: bot.id,
        playerName: bot.name,
        avatar: bot.avatar,
        serverTimestamp: serverNow,
        timeSeconds,
        points,
        rank,
        streak: bot.streak,
      });
    } else {
      bot.streak = 0;
      bot.currentAnswerScore = 0;
      bot.currentAnswerRank = undefined;
    }

    this.io.to(roomCode).emit('game:player_answered', {
      playerId: bot.id,
      playerName: bot.name,
    });

    this.checkAllPlayersAnswered(roomCode);
  }

  public submitAnswer(socketId: string, answerText: string): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'QUESTION_ACTIVE' || room.isPaused) return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player || player.hasAnsweredCurrent) return false;

    const rawQ = room.currentRawQuestion;
    if (!rawQ) return false;

    const serverNow = Date.now();
    const timeSeconds = Math.max(0.1, Number(((serverNow - room.questionStartTimeMs) / 1000).toFixed(2)));

    // Verify answer
    let isCorrect = false;
    if (room.currentRound === 1) {
      const q = rawQ as MovieFrameQuestion;
      isCorrect = checkAnswerCorrectness(answerText, q.title, q.aliases);
    } else if (room.currentRound === 2) {
      const q = rawQ as DialogueQuestion;
      isCorrect = checkAnswerCorrectness(answerText, q.movie, q.aliases);
    } else if (room.currentRound === 3) {
      const q = rawQ as SilhouetteQuestion;
      isCorrect = checkAnswerCorrectness(answerText, q.celebrity, q.aliases);
    } else if (room.currentRound === 4) {
      const q = rawQ as EyesQuestion;
      isCorrect = checkAnswerCorrectness(answerText, q.celebrity, q.aliases);
    }

    player.hasAnsweredCurrent = true;
    player.isCurrentAnswerCorrect = isCorrect;

    if (isCorrect) {
      player.streak++;
      if (player.streak > player.longestStreak) {
        player.longestStreak = player.streak;
      }
      player.correctAnswersCount++;

      const rank = room.currentQuestionAnswers.length + 1;
      const scoreObj = calculateScore(rank, player.streak);
      const points = scoreObj.total;

      player.score += points;
      player.roundScore += points;
      player.currentAnswerScore = points;
      player.currentAnswerRank = rank;

      if (!player.fastestAnswerTimeMs || timeSeconds < player.fastestAnswerTimeMs) {
        player.fastestAnswerTimeMs = timeSeconds;
      }

      room.currentQuestionAnswers.push({
        playerId: player.id,
        playerName: player.name,
        avatar: player.avatar,
        serverTimestamp: serverNow,
        timeSeconds,
        points,
        rank,
        streak: player.streak,
      });

      // Send immediate private confirmation to answering client
      this.io.to(socketId).emit('player:answer_result', {
        isCorrect: true,
        points,
        rank,
        streak: player.streak,
        message: rank === 1 ? '⚡ Lightning Fast! +1000' : `+${points} points!`,
      });
    } else {
      player.streak = 0;
      player.currentAnswerScore = 0;
      player.currentAnswerRank = undefined;

      // Send immediate private incorrect feedback to answering client
      this.io.to(socketId).emit('player:answer_result', {
        isCorrect: false,
        points: 0,
        message: 'Incorrect guess!',
      });
    }

    // Broadcast that player answered
    this.io.to(roomCode).emit('game:player_answered', {
      playerId: player.id,
      playerName: player.name,
    });

    this.checkAllPlayersAnswered(roomCode);
    return true;
  }

  private checkAllPlayersAnswered(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'QUESTION_ACTIVE') return;

    const activePlayers = Array.from(room.players.values()).filter((p) => p.isConnected);
    const allAnswered = activePlayers.every((p) => p.hasAnsweredCurrent);

    if (allAnswered) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      setTimeout(() => {
        this.revealCurrentQuestion(roomCode);
      }, 500);
    }
  }

  private revealCurrentQuestion(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'QUESTION_ACTIVE') return;

    if (room.timerInterval) clearInterval(room.timerInterval);

    room.status = 'QUESTION_REVEAL';
    const rawQ = room.currentRawQuestion;

    let revealData: RevealedAnswer = {
      correctAnswer: '',
      details: {},
      answersRace: room.currentQuestionAnswers,
    };

    if (room.currentRound === 1 && rawQ) {
      const q = rawQ as MovieFrameQuestion;
      revealData = {
        correctAnswer: q.title,
        details: {
          title: q.title,
          year: q.year,
          director: q.director,
          actors: q.actors,
          fullImageUrl: q.frameUrl,
        },
        answersRace: room.currentQuestionAnswers,
      };
    } else if (room.currentRound === 2 && rawQ) {
      const q = rawQ as DialogueQuestion;
      revealData = {
        correctAnswer: q.movie,
        details: {
          movie: q.movie,
          year: q.year,
          character: q.character,
          celebrity: q.actor,
        },
        answersRace: room.currentQuestionAnswers,
      };
    } else if (room.currentRound === 3 && rawQ) {
      const q = rawQ as SilhouetteQuestion;
      revealData = {
        correctAnswer: q.celebrity,
        details: {
          celebrity: q.celebrity,
          poseDescription: q.poseDescription,
          iconicMovieOrSong: q.iconicMovieOrSong,
          fullImageUrl: q.originalImageUrl,
        },
        answersRace: room.currentQuestionAnswers,
      };
    } else if (room.currentRound === 4 && rawQ) {
      const q = rawQ as EyesQuestion;
      revealData = {
        correctAnswer: q.celebrity,
        details: {
          celebrity: q.celebrity,
          signatureFeature: q.signatureFeature,
          actors: q.iconicMovies,
          fullImageUrl: q.fullImageUrl,
        },
        answersRace: room.currentQuestionAnswers,
      };
    }

    room.revealedAnswer = revealData;
    this.broadcastRoomState(roomCode);

    // Pause for 5.5s so players can appreciate the reveal and see scores, then next question
    room.revealTimeout = setTimeout(() => {
      room.currentQuestionIndex++;
      this.startNextQuestion(roomCode);
    }, 5500);
  }

  private showRoundSummary(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.status = 'ROUND_SUMMARY';
    const roundTitles = {
      1: 'Round 1: Movie Frames',
      2: 'Round 2: Iconic Dialogues',
      3: 'Round 3: Actress Silhouettes',
      4: 'Round 4: Celebrity Eyes',
    };

    const sortedLeaderboard = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        roundGain: p.roundScore,
        streak: p.streak,
      }));

    const nextRound = (room.currentRound < 4 ? ((room.currentRound + 1) as RoundType) : undefined);

    room.roundSummaryData = {
      round: room.currentRound,
      roundTitle: roundTitles[room.currentRound],
      nextRound,
      leaderboard: sortedLeaderboard,
    };

    this.broadcastRoomState(roomCode);

    setTimeout(() => {
      if (room.currentRound < 4) {
        this.startRoundIntro(roomCode, (room.currentRound + 1) as RoundType);
      } else {
        this.showFinalResults(roomCode);
      }
    }, 6000);
  }

  private showFinalResults(roomCode: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.status = 'FINAL_RESULTS';
    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0] || {
      id: 'none',
      name: 'No Winner',
      score: 0,
      avatar: '🏆',
    };

    const totalQuestions =
      room.settings.framesCount +
      room.settings.dialoguesCount +
      room.settings.silhouettesCount +
      room.settings.eyesCount;

    let longestStreakHolder = sortedPlayers[0];
    let fastestGuesser = sortedPlayers[0];
    for (const p of sortedPlayers) {
      if (p.longestStreak > (longestStreakHolder?.longestStreak ?? 0)) {
        longestStreakHolder = p;
      }
      if (
        p.fastestAnswerTimeMs &&
        (!fastestGuesser?.fastestAnswerTimeMs || p.fastestAnswerTimeMs < fastestGuesser.fastestAnswerTimeMs)
      ) {
        fastestGuesser = p;
      }
    }

    room.finalResultsData = {
      winner,
      leaderboard: sortedPlayers,
      stats: {
        totalQuestions,
        fastestGuesser: fastestGuesser?.fastestAnswerTimeMs
          ? {
              name: fastestGuesser.name,
              timeSeconds: fastestGuesser.fastestAnswerTimeMs,
              question: 'Lightning Speed',
            }
          : undefined,
        longestStreakHolder: longestStreakHolder
          ? {
              name: longestStreakHolder.name,
              streak: longestStreakHolder.longestStreak,
            }
          : undefined,
        highestAccuracy: sortedPlayers[0]
          ? {
              name: sortedPlayers[0].name,
              percentage: Math.round((sortedPlayers[0].correctAnswersCount / Math.max(1, totalQuestions)) * 100),
            }
          : undefined,
      },
    };

    this.broadcastRoomState(roomCode);
  }

  public hostAction(
    socketId: string,
    action: 'pause' | 'resume' | 'skip' | 'end_game'
  ): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player || !player.isHost) return false;

    if (action === 'pause') {
      room.isPaused = true;
      this.broadcastRoomState(roomCode);
    } else if (action === 'resume') {
      room.isPaused = false;
      this.broadcastRoomState(roomCode);
    } else if (action === 'skip') {
      if (room.status === 'QUESTION_ACTIVE') {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.revealCurrentQuestion(roomCode);
      }
    } else if (action === 'end_game') {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.revealTimeout) clearTimeout(room.revealTimeout);
      this.showFinalResults(roomCode);
    }

    return true;
  }

  public playAgain(socketId: string): boolean {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return false;
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'FINAL_RESULTS') return false;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player || !player.isHost) return false;

    room.status = 'LOBBY';
    room.currentRound = 1;
    room.currentQuestionIndex = 0;
    room.revealedAnswer = undefined;
    room.roundSummaryData = undefined;
    room.finalResultsData = undefined;
    room.isPaused = false;

    for (const p of room.players.values()) {
      p.score = 0;
      p.roundScore = 0;
      p.streak = 0;
      p.longestStreak = 0;
      p.correctAnswersCount = 0;
      p.hasAnsweredCurrent = false;
      p.isCurrentAnswerCorrect = undefined;
      p.currentAnswerScore = undefined;
      p.currentAnswerRank = undefined;
    }

    this.broadcastRoomState(roomCode);
    return true;
  }

  public handleDisconnect(socketId: string) {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return;

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = Array.from(room.players.values()).find((p) => p.socketId === socketId);
    if (!player) return;

    // Do NOT delete the player immediately!
    // Set isConnected = false and start a 30s grace period for re-connecting
    player.isConnected = false;

    this.io.to(roomCode).emit('player:notification', {
      type: 'player_disconnected',
      message: `${player.name} connection lost (waiting for reconnect...)`,
    });

    this.broadcastRoomState(roomCode);

    // Clear any existing timer for this player
    const existing = this.disconnectGraceTimers.get(player.id);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      this.disconnectGraceTimers.delete(player.id);
      this.finalizeDisconnect(roomCode, player.id);
    }, DISCONNECT_GRACE_PERIOD_MS);

    this.disconnectGraceTimers.set(player.id, { timer, roomCode, playerId: player.id });
  }

  private finalizeDisconnect(roomCode: string, playerId: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player || player.isConnected) return; // Player reconnected during grace period!

    if (room.status === 'LOBBY') {
      // In lobby, permanently remove after grace period expires
      room.players.delete(playerId);

      if (room.players.size === 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        if (room.revealTimeout) clearTimeout(room.revealTimeout);
        this.rooms.delete(roomCode);
        return;
      }

      if (player.isHost) {
        const nextHost =
          Array.from(room.players.values()).find((p) => p.isConnected && !p.isBot) ||
          Array.from(room.players.values()).find((p) => !p.isBot) ||
          room.players.values().next().value;
        if (nextHost) {
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          this.io.to(roomCode).emit('player:notification', {
            type: 'host_transfer',
            message: `${nextHost.name} is now the Host!`,
          });
        }
      }

      this.broadcastRoomState(roomCode);
    } else {
      // In-game: transfer host if host disconnected
      if (player.isHost) {
        const nextHost =
          Array.from(room.players.values()).find((p) => p.isConnected && !p.isBot) ||
          Array.from(room.players.values()).find((p) => !p.isBot);
        if (nextHost) {
          player.isHost = false;
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          this.io.to(roomCode).emit('player:notification', {
            type: 'host_transfer',
            message: `${nextHost.name} is now the Host!`,
          });
        }
      }

      const anyConnected = Array.from(room.players.values()).some((p) => p.isConnected);
      if (!anyConnected) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        if (room.revealTimeout) clearTimeout(room.revealTimeout);
        this.rooms.delete(roomCode);
        return;
      }

      this.broadcastRoomState(roomCode);
    }
  }

  public getClientRoomState(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    let activeClientQuestion: ClientQuestion | undefined = undefined;
    if (room.status === 'QUESTION_ACTIVE' && room.currentRawQuestion) {
      const rawQ = room.currentRawQuestion;
      const totalInRound =
        room.currentRound === 1
          ? room.questionsR1.length
          : room.currentRound === 2
          ? room.questionsR2.length
          : room.currentRound === 3
          ? room.questionsR3.length
          : room.questionsR4.length;

      const totalQuestionsInGame =
        room.settings.framesCount +
        room.settings.dialoguesCount +
        room.settings.silhouettesCount +
        room.settings.eyesCount;

      let priorCount = 0;
      if (room.currentRound > 1) priorCount += room.settings.framesCount;
      if (room.currentRound > 2) priorCount += room.settings.dialoguesCount;
      if (room.currentRound > 3) priorCount += room.settings.silhouettesCount;

      const overallQuestionNumber = priorCount + room.currentQuestionIndex + 1;

      if (room.currentRound === 1) {
        const q = rawQ as MovieFrameQuestion;
        activeClientQuestion = {
          id: q.id,
          round: 1,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestionsInRound: totalInRound,
          totalQuestionsInGame,
          overallQuestionNumber,
          durationSeconds: room.settings.questionTimerSeconds,
          frameUrl: q.frameUrl,
          frameDescription: q.frameDescription,
          clue: q.clue,
        };
      } else if (room.currentRound === 2) {
        const q = rawQ as DialogueQuestion;
        activeClientQuestion = {
          id: q.id,
          round: 2,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestionsInRound: totalInRound,
          totalQuestionsInGame,
          overallQuestionNumber,
          durationSeconds: room.settings.questionTimerSeconds,
          dialogue: q.dialogue,
          englishMeaning: q.englishMeaning,
        };
      } else if (room.currentRound === 3) {
        const q = rawQ as SilhouetteQuestion;
        activeClientQuestion = {
          id: q.id,
          round: 3,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestionsInRound: totalInRound,
          totalQuestionsInGame,
          overallQuestionNumber,
          durationSeconds: room.settings.questionTimerSeconds,
          silhouetteImageUrl: q.silhouetteSvgUrl,
          poseDescription: q.poseDescription,
        };
      } else if (room.currentRound === 4) {
        const q = rawQ as EyesQuestion;
        activeClientQuestion = {
          id: q.id,
          round: 4,
          questionNumber: room.currentQuestionIndex + 1,
          totalQuestionsInRound: totalInRound,
          totalQuestionsInGame,
          overallQuestionNumber,
          durationSeconds: room.settings.questionTimerSeconds,
          eyesCropUrl: q.eyesCropUrl,
          gender: q.gender,
        };
      }
    }

    const totalQuestionsInRound =
      room.currentRound === 1
        ? room.questionsR1.length
        : room.currentRound === 2
        ? room.questionsR2.length
        : room.currentRound === 3
        ? room.questionsR3.length
        : room.questionsR4.length;

    return {
      roomCode: room.code,
      hostId: room.hostId,
      players: Array.from(room.players.values()),
      maxPlayers: 6,
      status: room.status,
      settings: room.settings,
      currentRound: room.currentRound,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestionsInCurrentRound: totalQuestionsInRound,
      activeQuestion: activeClientQuestion,
      revealedAnswer: room.revealedAnswer,
      roundSummary: room.roundSummaryData,
      finalResults: room.finalResultsData,
      timerSecondsRemaining: room.timerSecondsRemaining,
      isPaused: room.isPaused,
    };
  }

  public broadcastRoomState(roomCode: string) {
    const clientState = this.getClientRoomState(roomCode);
    if (!clientState) return;
    this.io.to(roomCode).emit('room:state', clientState);
  }
}
