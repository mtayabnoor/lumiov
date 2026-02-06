/**
 * Get Pods Tool
 *
 * Fetches real-time pod information from the Kubernetes cluster.
 * Supports filtering by namespace.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createGetPodsTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'get_pods',
    description:
      'Get a list of all pods in the Kubernetes cluster. Use this to answer questions about pods, their status, restarts, namespaces, and container information.',
    schema: z.object({
      namespace: z
        .string()
        .optional()
        .describe(
          'Optional: Filter pods by namespace. Leave empty for all namespaces.',
        ),
    }),
    func: async ({ namespace }) => {
      try {
        const pods = await k8sService.listResource('pods');

        // Filter by namespace if provided
        const filtered = namespace
          ? pods.filter((p: any) => p.metadata?.namespace === namespace)
          : pods;

        // Extract relevant information for the AI
        const summary = filtered.map((pod: any) => ({
          name: pod.metadata?.name,
          namespace: pod.metadata?.namespace,
          status: pod.status?.phase,
          ready:
            pod.status?.containerStatuses?.filter((c: any) => c.ready).length ??
            0,
          total: pod.spec?.containers?.length ?? 0,
          restarts: pod.status?.containerStatuses?.reduce(
            (sum: number, c: any) => sum + (c.restartCount || 0),
            0,
          ),
          node: pod.spec?.nodeName,
          age: pod.metadata?.creationTimestamp,
        }));

        return JSON.stringify({
          count: filtered.length,
          pods: summary,
        });
      } catch (error: any) {
        return JSON.stringify({
          error: error.message || 'Failed to fetch pods',
        });
      }
    },
  });
}
