import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service.js';
import { ResourceType } from '../types/common.js';

export const registerWatchResourceHandlers = (socket: Socket) => {
  console.log('Electron UI Connected');

  // TRACKER: Keeps track of "Stop Functions" for this specific connection
  // Key = 'pods', Value = function to stop the pod watcher
  const activeWatchers = new Map<string, () => void>();

  // 1. Handle Subscribe
  socket.on('subscribe', async (resource: ResourceType) => {
    // Step 1: Send the INITIAL LIST immediately
    // This prevents the "blank screen" while waiting for an event
    try {
      const items = await k8sService.listResource(resource);
      socket.emit('k8s-list', { resource, items });
    } catch (e) {
      socket.emit('error', `Failed to list ${resource}`);
    }

    // If already watching, don't duplicate streams
    if (activeWatchers.has(resource)) {
      console.log(`Already watching ${resource}, ignoring.`);
      return;
    }

    console.log(`Starting stream for: ${resource}`);

    // C. Step 2: Start the Long-Running Watcher
    const stopWatcher = k8sService.watchResource(
      resource,
      (type, object) => {
        // Emit event specifically for this resource
        // The frontend listens for 'k8s-event'
        socket.emit('k8s-event', { resource, type, object });
      },
      (err) => {
        console.error(`Watch error for ${resource}`, err);
      },
    );

    // Save the stop function so we can call it later
    activeWatchers.set(resource, stopWatcher);
  });

  // 2. Handle Unsubscribe
  socket.on('unsubscribe', (resource: ResourceType) => {
    const stop = activeWatchers.get(resource);
    if (stop) {
      stop(); // Kill the specific K8s connection
      activeWatchers.delete(resource); // Remove from map
    }
  });

  // 3. Cleanup on App Close / Refresh
  socket.on('disconnect', () => {
    console.log('Electron UI Disconnected - Cleaning up all watchers');
    activeWatchers.forEach((stopFunc) => stopFunc());
    activeWatchers.clear();
  });
};
