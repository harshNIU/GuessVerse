/**
 * Bollywood Guess - Multiplayer Party Game
 */

import React, { useState, useEffect, useCallback } from 'react';
import { socketService } from './services/socket.ts';
import { RoomState, GameSettings } from '../shared/types.ts';
import { Header } from './components/Header.tsx';
import { LandingScreen } from './components/LandingScreen.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { RoundIntro } from './components/RoundIntro.tsx';
import { Round1Frame } from './components/Round1Frame.tsx';
import { Round2Dialogue } from './components/Round2Dialogue.tsx';
import { Round3Silhouette } from './components/Round3Silhouette.tsx';
import { Round4Eyes } from './components/Round4Eyes.tsx';
import { RevealScreen } from './components/RevealScreen.tsx';
import { RoundSummary } from './components/RoundSummary.tsx';
import { FinalLeaderboard } from './components/FinalLeaderboard.tsx';
import { HostControls } from './components/HostControls.tsx';
import { sound } from './services/sound.ts';

function getSessionId(): string {
  let sid = sessionStorage.getItem('bg_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('bg_session_id', sid);
  }
  return sid;
}

export default function App() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>(() => sessionStorage.getItem('bg_player_id') || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdownNumber, setCountdownNumber] = useState<number | undefined>(undefined);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Private answer feedback for the current player
  const [myAnswerResult, setMyAnswerResult] = useState<{
    isCorrect: boolean;
    points: number;
    rank?: number;
    streak?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const socket = socketService.getSocket();

    // 1. Session Reconnection recovery
    const attemptReconnect = () => {
      const savedRoom = sessionStorage.getItem('bg_room_code');
      const savedPlayer = sessionStorage.getItem('bg_player_id');
      const sessionId = getSessionId();

      if (savedRoom && savedPlayer) {
        socket.emit(
          'room:reconnect',
          { roomCode: savedRoom, playerId: savedPlayer, sessionId },
          (response: { success: boolean; roomState?: RoomState; error?: string }) => {
            if (response.success && response.roomState) {
              setPlayerId(savedPlayer);
              setRoomState(response.roomState);
            } else {
              // Session expired
              sessionStorage.removeItem('bg_room_code');
              sessionStorage.removeItem('bg_player_id');
              setRoomState(null);
              setPlayerId('');
            }
          }
        );
      }
    };

    socket.on('connect', attemptReconnect);
    if (socket.connected) {
      attemptReconnect();
    }

    // 2. Authoritative room state synchronization
    socket.on('room:state', (newState: RoomState) => {
      setRoomState(newState);

      // Reset question-specific private answer feedback when new question starts
      if (
        newState.status === 'QUESTION_ACTIVE' &&
        newState.timerSecondsRemaining >= newState.settings.questionTimerSeconds - 1
      ) {
        setMyAnswerResult(null);
      }
    });

    // 3. Countdown tick
    socket.on('game:countdown', ({ count }: { count: number }) => {
      setCountdownNumber(count);
      sound.playTick(count);
    });

    // 4. Private answer submission confirmation
    socket.on('player:answer_result', (result) => {
      setMyAnswerResult(result);
      if (result.isCorrect) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
    });

    // 5. Notifications (e.g. host reassigned, player joined, reconnects)
    socket.on('player:notification', ({ message }: { message: string }) => {
      setToastNotification(message);
      setTimeout(() => setToastNotification(null), 3000);
    });

    // 6. Errors
    socket.on('game:error', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 4000);
    });

    return () => {
      socket.off('connect', attemptReconnect);
      socket.off('room:state');
      socket.off('game:countdown');
      socket.off('player:answer_result');
      socket.off('player:notification');
      socket.off('game:error');
    };
  }, []);

  // Handle Create Room
  const handleCreateRoom = (playerName: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');
    const socket = socketService.getSocket();
    const sessionId = getSessionId();

    socket.emit(
      'room:create',
      { playerName, avatar, sessionId },
      (response: {
        success: boolean;
        roomCode?: string;
        playerId?: string;
        sessionId?: string;
        roomState?: RoomState;
        error?: string;
      }) => {
        setIsConnecting(false);
        if (response.success && response.playerId && response.roomState && response.roomCode) {
          sessionStorage.setItem('bg_room_code', response.roomCode);
          sessionStorage.setItem('bg_player_id', response.playerId);
          setPlayerId(response.playerId);
          setRoomState(response.roomState);
        } else {
          setErrorMessage(response.error || 'Failed to create room');
        }
      }
    );
  };

  // Handle Join Room
  const handleJoinRoom = (roomCode: string, playerName: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');
    const socket = socketService.getSocket();
    const sessionId = getSessionId();

    socket.emit(
      'room:join',
      { roomCode, playerName, avatar, sessionId },
      (response: {
        success: boolean;
        roomCode?: string;
        playerId?: string;
        sessionId?: string;
        roomState?: RoomState;
        error?: string;
      }) => {
        setIsConnecting(false);
        if (response.success && response.playerId && response.roomState && response.roomCode) {
          sessionStorage.setItem('bg_room_code', response.roomCode);
          sessionStorage.setItem('bg_player_id', response.playerId);
          setPlayerId(response.playerId);
          setRoomState(response.roomState);
        } else {
          setErrorMessage(response.error || 'Failed to join room');
        }
      }
    );
  };

  // Add Virtual Test Player (Clean server-authoritative bot, no socket conflict)
  const handleAddTestPlayer = () => {
    const socket = socketService.getSocket();
    socket.emit('room:add_test_player');
  };

  // Remove Virtual Test Player
  const handleRemoveTestPlayer = (botId: string) => {
    const socket = socketService.getSocket();
    socket.emit('room:remove_test_player', { botId });
  };

  // Update Settings (Host)
  const handleUpdateSettings = (settings: Partial<GameSettings>) => {
    const socket = socketService.getSocket();
    socket.emit('room:update_settings', { settings });
  };

  // Start Game (Host)
  const handleStartGame = () => {
    const socket = socketService.getSocket();
    socket.emit('room:start_game');
  };

  // Submit Answer
  const handleSubmitAnswer = (answer: string) => {
    const socket = socketService.getSocket();
    socket.emit('room:submit_answer', { answer });
  };

  // Host Action (pause, resume, skip, end_game)
  const handleHostAction = (action: 'pause' | 'resume' | 'skip' | 'end_game') => {
    const socket = socketService.getSocket();
    socket.emit('room:host_action', { action });
  };

  // Play Again
  const handlePlayAgain = () => {
    const socket = socketService.getSocket();
    socket.emit('room:play_again');
  };

  // Leave Room (Explicitly leaves room, keeps socket alive for future games)
  const handleLeaveRoom = () => {
    sessionStorage.removeItem('bg_room_code');
    sessionStorage.removeItem('bg_player_id');
    const socket = socketService.getSocket();
    socket.emit('room:leave');
    setRoomState(null);
    setPlayerId('');
    setMyAnswerResult(null);
  };

  const isHost = roomState ? roomState.hostId === playerId : false;
  const currentPlayer = roomState?.players.find((p) => p.id === playerId);
  const hasAnsweredCurrent = currentPlayer?.hasAnsweredCurrent ?? false;

  return (
    <div className="min-h-screen bg-[#0b0914] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Universal Top Bar */}
      <Header roomState={roomState} onLeaveRoom={roomState ? handleLeaveRoom : undefined} />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-2xl animate-bounce">
          {toastNotification}
        </div>
      )}

      {/* Main Game Screen Router */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* 1. Landing Screen */}
        {!roomState && (
          <LandingScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            isConnecting={isConnecting}
            errorMessage={errorMessage}
          />
        )}

        {/* 2. Lobby Screen */}
        {roomState && roomState.status === 'LOBBY' && (
          <LobbyScreen
            roomState={roomState}
            currentUserId={playerId}
            onUpdateSettings={handleUpdateSettings}
            onStartGame={handleStartGame}
            onAddTestPlayer={handleAddTestPlayer}
            onRemoveTestPlayer={handleRemoveTestPlayer}
          />
        )}

        {/* 3. Countdown Screen */}
        {roomState && roomState.status === 'COUNTDOWN' && (
          <RoundIntro round={1} countdownNumber={countdownNumber} />
        )}

        {/* 4. Round Intro Screen */}
        {roomState && roomState.status === 'ROUND_INTRO' && (
          <RoundIntro round={roomState.currentRound} />
        )}

        {/* 5. Active Question Screens */}
        {roomState && roomState.status === 'QUESTION_ACTIVE' && roomState.activeQuestion && (
          <>
            {roomState.currentRound === 1 && (
              <Round1Frame
                question={roomState.activeQuestion}
                timerRemaining={roomState.timerSecondsRemaining}
                players={roomState.players}
                currentUserId={playerId}
                hasAnswered={hasAnsweredCurrent}
                myAnswerResult={myAnswerResult}
                onSubmitAnswer={handleSubmitAnswer}
              />
            )}

            {roomState.currentRound === 2 && (
              <Round2Dialogue
                question={roomState.activeQuestion}
                timerRemaining={roomState.timerSecondsRemaining}
                players={roomState.players}
                currentUserId={playerId}
                hasAnswered={hasAnsweredCurrent}
                myAnswerResult={myAnswerResult}
                onSubmitAnswer={handleSubmitAnswer}
              />
            )}

            {roomState.currentRound === 3 && (
              <Round3Silhouette
                question={roomState.activeQuestion}
                timerRemaining={roomState.timerSecondsRemaining}
                players={roomState.players}
                currentUserId={playerId}
                hasAnswered={hasAnsweredCurrent}
                myAnswerResult={myAnswerResult}
                onSubmitAnswer={handleSubmitAnswer}
              />
            )}

            {roomState.currentRound === 4 && (
              <Round4Eyes
                question={roomState.activeQuestion}
                timerRemaining={roomState.timerSecondsRemaining}
                players={roomState.players}
                currentUserId={playerId}
                hasAnswered={hasAnsweredCurrent}
                myAnswerResult={myAnswerResult}
                onSubmitAnswer={handleSubmitAnswer}
              />
            )}
          </>
        )}

        {/* 6. Question Reveal Screen */}
        {roomState && roomState.status === 'QUESTION_REVEAL' && roomState.revealedAnswer && (
          <RevealScreen
            round={roomState.currentRound}
            revealedAnswer={roomState.revealedAnswer}
            currentUserId={playerId}
          />
        )}

        {/* 7. Round Summary Screen */}
        {roomState && roomState.status === 'ROUND_SUMMARY' && roomState.roundSummary && (
          <RoundSummary summary={roomState.roundSummary} currentUserId={playerId} />
        )}

        {/* 8. Final Results Leaderboard */}
        {roomState && roomState.status === 'FINAL_RESULTS' && roomState.finalResults && (
          <FinalLeaderboard
            finalResults={roomState.finalResults}
            currentUserId={playerId}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
            onNewRoom={handleLeaveRoom}
          />
        )}
      </main>

      {/* Floating Host Controls Drawer (Visible only to Host during active game) */}
      {roomState && isHost && roomState.status !== 'LOBBY' && roomState.status !== 'FINAL_RESULTS' && (
        <HostControls isPaused={roomState.isPaused} onHostAction={handleHostAction} />
      )}
    </div>
  );
}
