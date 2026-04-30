import { Socket } from 'socket.io';
import { k8sService } from '../services/kubernetes.service';
import { toAppError } from '../types/errors';

interface PodDetailsRequest {
  namespace: string;
  podName: string;
}

/**
 * Register pod details handlers for Socket.IO
 * Handles fetching comprehensive pod information (describe-like)
 */
export const registerPodDetailsHandlers = (socket: Socket) => {
  socket.on('pod-details:fetch', async (options: PodDetailsRequest, callback) => {
    const { namespace, podName } = options;

    // 1. VALIDATION: Fail fast if data is missing
    if (!namespace || !podName) {
      const error = toAppError(
        'Missing namespace or pod name',
        'VALIDATION_ERROR',
        false,
      );
      socket.emit('pod-details:error', error);
      if (callback) callback(error);
      return;
    }

    console.log(`🔍 [Pod Details] Fetch: ${namespace}/${podName}`);

    try {
      // Fetch pod describe details
      const details = await k8sService.getPodDescribeDetails(namespace, podName);

      // Emit success with details
      socket.emit('pod-details:data', details);

      // If callback provided, also invoke it with the data
      if (callback) callback(null, details);
    } catch (err: any) {
      console.error(`❌ [Pod Details] Failed to fetch for ${podName}:`, err.message);

      // Determine if error is recoverable
      const isNotFound = err.message?.includes('Not Found') || err.status === 404;
      const isRecoverable = !isNotFound;

      const error = toAppError(
        isNotFound
          ? `Pod "${podName}" not found in namespace "${namespace}"`
          : err.message,
        isNotFound ? 'POD_NOT_FOUND' : 'POD_DETAILS_FAILED',
        isRecoverable,
      );

      socket.emit('pod-details:error', error);
      if (callback) callback(error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🛑 [Pod Details] Client disconnected: ${socket.id}`);
  });
};
