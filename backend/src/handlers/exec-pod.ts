// exec-pod.ts
import { Socket } from 'socket.io';
import { k8sService, ShellSession } from '../services/kubernetes.service.js';

export function registerExecHandlers(socket: Socket) {
  console.log(`🔌 Exec client connected: ${socket.id}`);

  // Track active exec session
  let currentExecSession: ShellSession | null = null;

  // EVENT: Frontend requests to exec into pod
  socket.on(
    'exec:start',
    (params: { namespace: string; podName: string; container?: string }) => {
      console.log(
        `🎯 Starting exec for pod: ${params.podName} in namespace: ${params.namespace}`,
      );

      // Cleanup previous session if exists
      if (currentExecSession) {
        console.log(`🔄 Cleaning up previous exec session...`);
        currentExecSession.kill();
        currentExecSession = null;
      }

      // Determine container name (use first container if not specified)
      const containerName = params.container || 'main';
      console.log(
        `🎯 Starting exec for pod: ${params.podName} in namespace: ${params.namespace} and container: ${containerName}`,
      );

      // Start exec session
      currentExecSession = k8sService.execPod(
        params.namespace,
        params.podName,
        containerName,
        (data: string) => {
          // Send terminal output to frontend
          console.log(`📤 [EXEC STDOUT] ${data.length} bytes`); // noisy
          socket.emit('exec:data', data);
        },
        (err: string) => {
          socket.emit('exec:error', { message: err });
        },
      );
    },
  );

  // EVENT: Frontend sends input to terminal
  socket.on('exec:input', (data: string) => {
    if (currentExecSession) {
      currentExecSession.write(data);
    }
  });

  // EVENT: Frontend requests to resize terminal
  socket.on('exec:resize', (dimensions: { rows: number; cols: number }) => {
    if (currentExecSession && currentExecSession.resize) {
      // Protect against 0x0 resizes which kill the output
      if (dimensions.rows > 0 && dimensions.cols > 0) {
        currentExecSession.resize(dimensions.cols, dimensions.rows);
      }
    }
  });

  socket.on('exec:stop', () => {
    if (currentExecSession) {
      console.log('🛑 Client requested exec stop');
      currentExecSession.kill();
      currentExecSession = null;
    }
  });

  // CLEANUP on disconnect
  socket.on('disconnect', () => {
    if (currentExecSession) {
      console.log(
        `❌ Exec client ${socket.id} disconnected. Cleaning up session.`,
      );
      currentExecSession.kill();
      currentExecSession = null;
    } else {
      console.log(
        `❌ Exec client ${socket.id} disconnected. No active session.`,
      );
    }
  });
}
