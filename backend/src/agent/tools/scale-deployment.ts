import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';
import {
  buildConfirmationMessage,
  createPendingAction,
  evaluateScaleRequest,
} from '../safety/safety-policy.service';
import type { ToolSafetyContext } from './tool-safety-context';

export function createScaleDeploymentTool(
  safetyContext?: ToolSafetyContext,
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'scale_deployment',
    description: 'Scale a deployment in a namespace',
    schema: z.object({
      name: z.string().describe('The name of the deployment to scale'),
      namespace: z.string().describe('The namespace where the deployment is located'),
      replicas: z
        .number()
        .int()
        .nonnegative()
        .describe('The number of replicas to scale to'),
    }),
    func: async ({ name, namespace, replicas }) => {
      try {
        const currentReplicas = await k8sService.getDeploymentReplicaCount(
          name,
          namespace,
        );

        const decision = evaluateScaleRequest(name, namespace, replicas, currentReplicas);

        if (!decision.allow && !decision.requiresConfirmation) {
          return JSON.stringify({
            success: false,
            code: decision.code,
            error: decision.message || 'Scaling request blocked by safety policy.',
          });
        }

        if (decision.requiresConfirmation) {
          const pendingAction = createPendingAction({
            type: 'scale_deployment',
            summary: `Scale deployment ${name} in namespace ${namespace} to ${replicas} replicas`,
            params: {
              name,
              namespace,
              replicas,
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

        const result = await k8sService.scaleDeployment(name, namespace, replicas);
        return JSON.stringify({
          success: true,
          message: result,
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: error.message || 'Failed to scale deployment',
        });
      }
    },
  });
}
