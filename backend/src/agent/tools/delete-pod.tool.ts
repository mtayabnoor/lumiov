import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createDeletePodTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'delete-pod',
    description: 'Delete a pod in a namespace',
    schema: z.object({
      namespace: z.string().describe('The namespace of the pod'),
      name: z.string().describe('The name of the pod'),
    }),
    func: async ({ namespace, name }) => {
      try {
        await k8sService.deleteResourceGeneric('v1', 'Pod', name, namespace);
        return `Pod ${name} deleted successfully`;
      } catch (err: any) {
        return `Error deleting pod: ${err.message}`;
      }
    },
  });
}
