/**
 * Delete Pod Tool
 *
 * Allows the agent to delete a specific pod in the Kubernetes cluster.
 * ONLY available if write permissions are enabled.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';
import {
  buildConfirmationMessage,
  createPendingAction,
  evaluateDeletePodRequest,
} from '../safety/safety-policy.service';
import type { ToolSafetyContext } from './tool-safety-context';

export function createDeletePodTool(
  safetyContext?: ToolSafetyContext,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'delete_pod',
    description:
      'Delete a specific pod in the Kubernetes cluster. Use this ONLY when the user explicitly asks to delete a pod. Requires name and namespace.',
    schema: z.object({
      name: z.string().describe('The strict name of the pod to delete.'),
      namespace: z.string().describe('The exact namespace the pod resides in.'),
    }),
    func: async ({ name, namespace }) => {
      try {
        const decision = evaluateDeletePodRequest(name, namespace);

        if (!decision.allow && !decision.requiresConfirmation) {
          return JSON.stringify({
            success: false,
            code: decision.code,
            error: decision.message || 'Delete request blocked by safety policy.',
          });
        }

        if (decision.requiresConfirmation) {
          const pendingAction = createPendingAction({
            type: 'delete_pod',
            summary: `Delete pod ${name} in namespace ${namespace}`,
            params: {
              name,
              namespace,
            },
          });

          safetyContext?.setPendingAction(pendingAction);

          return JSON.stringify({
            success: false,
            code: decision.code,
            error: decision.message,
            confirmation: buildConfirmationMessage(pendingAction),
          });
        }

        const result = await k8sService.deleteResourceGeneric(
          'v1',
          'Pod',
          name,
          namespace,
        );
        return JSON.stringify({
          success: true,
          message: result,
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: error.message || `Failed to delete pod ${name}`,
        });
      }
    },
  });
}
