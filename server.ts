import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { RoomManager } from './server/game/roomManager.ts';
import { contentManager } from './server/data/contentManager.ts';
import { GameSettings } from './shared/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const roomManager = new RoomManager(io);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static serving for uploaded user images
  app.use('/uploads', express.static(uploadsDir));
  app.use('/api/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'Bollywood Guess Multiplayer', timestamp: new Date().toISOString() });
  });

  // Image Upload API (Accepts Base64 image payload)
  app.post('/api/upload-image', (req, res) => {
    try {
      const { imageBase64, filename } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      // Extract format and data
      let extension = 'jpg';
      let base64Data = imageBase64;
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        const mime = parts[0].split(':')[1];
        if (mime.includes('png')) extension = 'png';
        else if (mime.includes('webp')) extension = 'webp';
        else if (mime.includes('svg')) extension = 'svg';
        else if (mime.includes('gif')) extension = 'gif';
        base64Data = parts[1];
      }

      const cleanName = filename
        ? filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
        : 'bollywood';
      const outputFilename = `${Date.now()}_${cleanName}.${extension}`;
      const outputPath = path.resolve(uploadsDir, outputFilename);

      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));

      const publicUrl = `/api/uploads/${outputFilename}`;
      res.json({ success: true, url: publicUrl, filename: outputFilename });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      res.status(500).json({ error: err.message || 'Image upload failed' });
    }
  });

  // Content Management Endpoints (Custom Questions & Uploaded Content)
  app.get('/api/content', (req, res) => {
    try {
      const customDb = contentManager.getCustomDatabase();
      res.json({
        custom: customDb,
        counts: {
          frames: contentManager.getAllFrames().length,
          dialogues: contentManager.getAllDialogues().length,
          silhouettes: contentManager.getAllSilhouettes().length,
          eyes: contentManager.getAllEyes().length,
          customTotal:
            customDb.frames.length +
            customDb.dialogues.length +
            customDb.silhouettes.length +
            customDb.eyes.length,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add custom question
  app.post('/api/content/add', (req, res) => {
    try {
      const { type, data } = req.body;
      if (!type || !data) {
        return res.status(400).json({ error: 'Missing type or data' });
      }

      let addedItem: any;
      if (type === 'frame') {
        addedItem = contentManager.addFrame(data);
      } else if (type === 'dialogue') {
        addedItem = contentManager.addDialogue(data);
      } else if (type === 'silhouette') {
        addedItem = contentManager.addSilhouette(data);
      } else if (type === 'eyes') {
        addedItem = contentManager.addEyes(data);
      } else {
        return res.status(400).json({ error: 'Invalid question type' });
      }

      res.json({ success: true, item: addedItem });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete custom question
  app.delete('/api/content/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = contentManager.deleteItem(id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear category or all custom questions
  app.post('/api/content/clear', (req, res) => {
    try {
      const { category } = req.body;
      const cleared = contentManager.clearAll(category);
      res.json({ success: cleared });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    // 1. Create Room
    socket.on('room:create', ({ playerName, avatar, sessionId }: { playerName: string; avatar: string; sessionId?: string }, callback) => {
      try {
        const { roomCode, playerId, persistentSessionId } = roomManager.createRoom(socket.id, playerName, avatar, sessionId);
        socket.join(roomCode);
        const roomState = roomManager.getClientRoomState(roomCode);
        if (callback) callback({ success: true, roomCode, playerId, sessionId: persistentSessionId, roomState });
        roomManager.broadcastRoomState(roomCode);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to create room' });
      }
    });

    // 2. Join Room
    socket.on('room:join', ({ roomCode, playerName, avatar, sessionId }: { roomCode: string; playerName: string; avatar: string; sessionId?: string }, callback) => {
      try {
        const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
        const result = roomManager.joinRoom(socket.id, cleanCode, playerName, avatar, sessionId);
        if (result.success && result.playerId) {
          socket.join(cleanCode);
          const roomState = roomManager.getClientRoomState(cleanCode);
          if (callback) callback({ success: true, roomCode: cleanCode, playerId: result.playerId, sessionId: result.sessionId, roomState });
          roomManager.broadcastRoomState(cleanCode);
        } else {
          if (callback) callback({ success: false, error: result.error || 'Failed to join room' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to join room' });
      }
    });

    // 3. Reconnect Session
    socket.on('room:reconnect', ({ roomCode, playerId, sessionId }: { roomCode: string; playerId: string; sessionId?: string }, callback) => {
      try {
        const cleanCode = roomCode ? roomCode.trim().toUpperCase() : '';
        const result = roomManager.reconnectPlayer(socket.id, cleanCode, playerId, sessionId);
        if (result.success) {
          socket.join(cleanCode);
          const roomState = roomManager.getClientRoomState(cleanCode);
          if (callback) callback({ success: true, roomState });
          roomManager.broadcastRoomState(cleanCode);
        } else {
          if (callback) callback({ success: false, error: result.error });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. Explicit Leave Room
    socket.on('room:leave', () => {
      roomManager.leaveRoom(socket.id);
    });

    // 5. Add Virtual Test Player (Host only)
    socket.on('room:add_test_player', () => {
      roomManager.addTestPlayer(socket.id);
    });

    // 6. Remove Virtual Test Player (Host only)
    socket.on('room:remove_test_player', ({ botId }: { botId: string }) => {
      roomManager.removeTestPlayer(socket.id, botId);
    });

    // 7. Update Settings (Host only)
    socket.on('room:update_settings', ({ settings }: { settings: Partial<GameSettings> }) => {
      roomManager.updateSettings(socket.id, settings);
    });

    // 8. Start Game (Host only)
    socket.on('room:start_game', () => {
      roomManager.startGame(socket.id);
    });

    // 9. Submit Answer
    socket.on('room:submit_answer', ({ answer }: { answer: string }) => {
      roomManager.submitAnswer(socket.id, answer);
    });

    // 10. Host controls (pause, resume, skip, end_game)
    socket.on('room:host_action', ({ action }: { action: 'pause' | 'resume' | 'skip' | 'end_game' }) => {
      roomManager.hostAction(socket.id, action);
    });

    // 11. Play Again
    socket.on('room:play_again', () => {
      roomManager.playAgain(socket.id);
    });

    // 12. Disconnect
    socket.on('disconnect', () => {
      roomManager.handleDisconnect(socket.id);
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/uploads')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode with built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Always listen on port 3000 (nginx listens on 8080 and reverse proxies to 3000)
  const port = 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`🎬 Bollywood Guess Multiplayer Server listening on port ${port} [Mode: ${isProduction ? 'prod' : 'dev'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Bollywood Guess server:', err);
  process.exit(1);
});
