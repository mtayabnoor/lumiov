import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service.js';

// Track active log streams for this specific module
// Key: socket.id, Value: cleanup function
const activeLogStreams = new Map<string, () => void>();

export const registerLogHandlers = (socket: Socket) => {
  // 1. SUBSCRIBE: Start streaming logs
  socket.on('logs:subscribe', async ({ namespace, podName, containerName }) => {
    console.log(`📜 [Logs] Start request: ${podName} (ns: ${namespace})`);

    // Clean up previous stream if exists for this user
    cleanupLogStream(socket.id);

    try {
      const stopStream = await k8sService.streamPodLogs(
        namespace,
        podName,
        containerName || '',
        (logChunk) => {
          // Send data ONLY to this client
          socket.emit('logs:data', logChunk);
        },
        (err) => {
          socket.emit('logs:error', err);
        },
      );

      // Save cleanup function
      activeLogStreams.set(socket.id, stopStream);
    } catch (error: any) {
      console.error('❌ [Logs] Start failed:', error);
      socket.emit('logs:error', error.message || 'Failed to start logs');
    }
  });

  // 2. UNSUBSCRIBE: User closed the drawer
  socket.on('logs:unsubscribe', () => {
    cleanupLogStream(socket.id);
    console.log(`🛑 [Logs] Unsubscribed: ${socket.id}`);
  });

  // 3. DISCONNECT: User left the app
  // Socket.IO allows multiple disconnect listeners, so this is safe
  socket.on('disconnect', () => {
    cleanupLogStream(socket.id);
  });
};

// Helper to kill streams safely
const cleanupLogStream = (socketId: string) => {
  if (activeLogStreams.has(socketId)) {
    const stopStream = activeLogStreams.get(socketId);
    if (stopStream) stopStream();
    activeLogStreams.delete(socketId);
  }
};
