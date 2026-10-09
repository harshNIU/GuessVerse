import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  public getSocket(): Socket {
    if (!this.socket) {
      // Connect to the same host/port the application is served on
      this.socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('✅ [Socket] Connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ [Socket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ [Socket] Connection attempt error:', err.message);
      });
    }
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
