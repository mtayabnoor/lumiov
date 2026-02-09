import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createScaleDeploymentTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'scale_deployment',
    description: 'Scale a deployment in a namespace',
    schema: z.object({
      name: z.string().describe('The name of the deployment to scale'),
      namespace: z
        .string()
        .describe('The namespace where the deployment is located'),
      replicas: z.number().describe('The number of replicas to scale to'),
    }),
    func: async ({ name, namespace, replicas }) => {
      try {
        const result = await k8sService.scaleDeployment(
          name,
          namespace,
          replicas,
        );
        return result;
      } catch (error: any) {
        return JSON.stringify({
          error: error.message || 'Failed to scale deployment',
        });
      }
    },
  });
}
