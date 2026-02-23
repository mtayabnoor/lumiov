import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../interfaces/socket';

// Singleton instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    socket = io(`http://localhost:3030`, {
      transports: ['websocket'],
      autoConnect: false, // We will call connect() manually
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // Debug logging
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        window.dispatchEvent(
          new CustomEvent('global-error', { detail: `Backend disconnected: ${reason}` }),
        );
      }
    });

    socket.on('connect_error', (err) => {
      console.error('⚠️ Socket connect error:', err);
      // Wait for 3 seconds of connection error before notifying, as reconnects are fast
      window.dispatchEvent(
        new CustomEvent('global-error', { detail: `Connection error: ${err.message}` }),
      );
    });
  }
  return socket;
};
