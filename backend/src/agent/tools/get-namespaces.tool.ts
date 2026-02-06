/**
 * Get Namespaces Tool
 *
 * Fetches namespace information from the Kubernetes cluster.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createGetNamespacesTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'get_namespaces',
    description:
      'Get a list of all namespaces in the Kubernetes cluster. Use this to see what namespaces exist.',
    schema: z.object({}),
    func: async () => {
      try {
        const namespaces = await k8sService.listResource('namespaces');

        const summary = namespaces.map((ns: any) => ({
          name: ns.metadata?.name,
          status: ns.status?.phase,
          age: ns.metadata?.creationTimestamp,
          labels: ns.metadata?.labels,
        }));

        return JSON.stringify({
          count: namespaces.length,
          namespaces: summary,
        });
      } catch (error: any) {
        return JSON.stringify({
          error: error.message || 'Failed to fetch namespaces',
        });
      }
    },
  });
}
