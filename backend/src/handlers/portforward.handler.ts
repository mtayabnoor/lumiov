import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service';
import type { PortForwardSession } from '../types/common';
import { toAppError } from '../types/errors';

interface PortForwardStartParams {
  namespace: string;
  podName: string;
  localPort: number;
  remotePort: number;
}

export function registerPortForwardHandlers(socket: Socket) {
  let currentSession: PortForwardSession | null = null;

  const stopCurrentSession = () => {
    if (currentSession) {
      currentSession.stop();
      currentSession = null;
    }
  };

  socket.on('portforward:start', async (params: PortForwardStartParams) => {
    const { namespace, podName, localPort, remotePort } = params;

    if (!namespace || !podName || !localPort || !remotePort) {
      socket.emit(
        'portforward:error',
        toAppError(
          'Missing namespace, podName, localPort, or remotePort',
          'VALIDATION_ERROR',
          false,
        ),
      );
      return;
    }

    stopCurrentSession();

    let hasEmittedResult = false;

    try {
      currentSession = await k8sService.startPodPortForward(
        namespace,
        podName,
        localPort,
        remotePort,
        (err) => {
          // Only emit error if we haven't already emitted success
          // Stream errors after successful startup are not fatal
          if (!hasEmittedResult) {
            hasEmittedResult = true;
            socket.emit('portforward:error', toAppError(err, 'PORTFORWARD_ERROR', true));
          } else {
            // Log non-fatal stream errors that occur after tunnel is established
            console.warn(
              `⚠️ Non-fatal port-forward stream error (tunnel still active): ${err}`,
            );
          }
        },
      );

      // Only emit success if no error occurred during setup
      if (!hasEmittedResult) {
        hasEmittedResult = true;
        socket.emit('portforward:started', {
          namespace,
          podName,
          localPort,
          remotePort,
        });
      }
    } catch (err) {
      if (!hasEmittedResult) {
        hasEmittedResult = true;
        socket.emit(
          'portforward:error',
          toAppError(err, 'PORTFORWARD_START_FAILED', true),
        );
      }
    }
  });

  socket.on('portforward:stop', () => {
    stopCurrentSession();
  });

  socket.on('disconnect', () => {
    stopCurrentSession();
  });
}
