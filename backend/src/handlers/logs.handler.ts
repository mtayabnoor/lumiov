import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service.js';

interface LogSubscribeOptions {
  namespace: string;
  podName: string;
  containerName?: string;
  containers?: string[];
  tailLines?: number;
  sinceSeconds?: number;
  previous?: boolean;
  timestamps?: boolean;
  follow?: boolean;
}

// Key: socket.id, Value: array of cleanup functions
const activeLogStreams = new Map<string, (() => void)[]>();

export const registerLogHandlers = (socket: Socket) => {
  socket.on('logs:subscribe', async (options: LogSubscribeOptions) => {
    const {
      namespace,
      podName,
      containerName,
      containers,
      tailLines,
      sinceSeconds,
      previous,
      timestamps,
      follow,
    } = options;

    // 1. VALIDATION: Fail fast if data is missing
    if (!namespace || !podName) {
      socket.emit('logs:error', 'Missing namespace or pod name');
      return;
    }

    console.log(
      `📜 [Logs] Subscribe: ${podName} (${containerName || 'single'})`,
    );

    // 2. CLEANUP: Stop any existing streams for this user immediately
    cleanupLogStream(socket.id);

    // 3. INITIALIZE: Create the entry in the map immediately
    // This ensures that even if the first stream succeeds and the second fails,
    // we still have a place to store the first one's cleanup function.
    activeLogStreams.set(socket.id, []);

    // Determine containers
    const containersToStream =
      containerName === 'all' && containers?.length
        ? containers
        : [containerName || ''];

    // 4. PARALLEL EXECUTION: Start all streams at once
    const streamPromises = containersToStream.map(async (container) => {
      let lineBuffer = '';

      try {
        const stopStream = await k8sService.streamPodLogs(
          namespace,
          podName,
          container,
          (logChunk) => {
            // Buffer incoming chunk
            lineBuffer += logChunk;

            // Only process if we have complete lines
            if (lineBuffer.includes('\n')) {
              const lines = lineBuffer.split('\n');
              // The last element is the potential partial line (or empty if chunk ended with \n)
              lineBuffer = lines.pop() || '';

              if (lines.length === 0) return;

              // Multi-container tagging
              if (containersToStream.length > 1) {
                const prefix = `[${container}] `;
                const tagged = lines.map((l) => prefix + l).join('\n');
                socket.emit('logs:data', tagged);
              } else {
                socket.emit('logs:data', lines.join('\n'));
              }
            }
          },
          (err) => {
            const errString = String(err);
            if (errString.includes('400') && previous) {
              socket.emit(
                'logs:error',
                `Container "${container}" has no previous logs.`,
              );
            } else {
              socket.emit('logs:error', errString);
            }
          },
          { tailLines, sinceSeconds, previous, timestamps, follow },
        );

        // ✅ CRITICAL FIX: Add to map ONLY if connection succeeded
        // We check if the socket is still active just in case
        if (activeLogStreams.has(socket.id)) {
          const currentStreams = activeLogStreams.get(socket.id) || [];
          currentStreams.push(stopStream);
          activeLogStreams.set(socket.id, currentStreams);
        } else {
          // Edge case: User disconnected *while* we were connecting
          stopStream();
        }
      } catch (error) {
        const err = error as Error;
        console.error(
          `❌ [Logs] Failed to stream container ${container}:`,
          err,
        );
        socket.emit(
          'logs:error',
          `Failed to stream ${container}: ${err.message}`,
        );
      }
    });

    // We don't await this blocking the UI, but we catch unhandled promise rejections
    await Promise.all(streamPromises);
  });

  socket.on('logs:unsubscribe', () => {
    cleanupLogStream(socket.id);
    console.log(`🛑 [Logs] Unsubscribed: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    cleanupLogStream(socket.id);
  });
};

// Robust Cleanup Helper
const cleanupLogStream = (socketId: string) => {
  if (activeLogStreams.has(socketId)) {
    const cleanupFns = activeLogStreams.get(socketId) || [];

    cleanupFns.forEach((fn) => {
      try {
        fn(); // Run cleanup
      } catch (err) {
        console.error('Error closing stream:', err);
      }
    });

    activeLogStreams.delete(socketId);
  }
};
