// socketService.ts
import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service.js';

export function registerSocketHandlers(socket: Socket) {
  console.log(`🔌 Client connected: ${socket.id}`);

  // TRACKER: Holds the "Stop Function" for the currently active watch.
  // This is unique to this specific client connection.
  let currentStopper: (() => void) | null = null;

  // EVENT: Frontend requests to watch a resource
  socket.on('watch', (objectType: string) => {
    // 1. CLEANUP PREVIOUS WATCH
    // If the user was already watching something (e.g., pods), stop it
    // before starting the new one (e.g., deployments).
    if (currentStopper) {
      console.log(`🔄 Switching context: Stopping previous watch...`);
      currentStopper(); // Kill the old K8s loop
      currentStopper = null;
    }

    console.log(`🎯 Starting watch for: ${objectType}`);

    // 2. VALIDATE INPUT
    if (objectType !== 'pods' && objectType !== 'deployments') {
      socket.emit('error', { message: `Unknown resource: ${objectType}` });
      return;
    }

    // 3. START NEW WATCH & SAVE THE STOPPER
    // We assume k8sService.watchResource returns a function to stop the watch
    currentStopper = k8sService.watchResource(
      objectType as 'pods' | 'deployments',
      (action: string, obj: any) => {
        // Send data to frontend
        socket.emit('data', {
          resource: objectType,
          action: action,
          object: obj,
        });
      },
      (err: Error) => {
        socket.emit('error', { message: err.message });
      },
    );
  });

  // 4. CLEANUP ON DISCONNECT
  // If the user closes the app or refreshes, kill the active watch
  socket.on('disconnect', () => {
    if (currentStopper) {
      console.log(`❌ Client ${socket.id} disconnected. Cleaning up watch.`);
      currentStopper(); // Crucial: Stop the K8s connection
      currentStopper = null;
    } else {
      console.log(`❌ Client ${socket.id} disconnected. No active watch.`);
    }
  });
}
