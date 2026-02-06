/**
 * Get Deployments Tool
 *
 * Fetches deployment information from the Kubernetes cluster.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createGetDeploymentsTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'get_deployments',
    description:
      'Get a list of all deployments in the Kubernetes cluster. Use this to answer questions about deployments, replicas, and scaling.',
    schema: z.object({
      namespace: z
        .string()
        .optional()
        .describe(
          'Optional: Filter deployments by namespace. Leave empty for all namespaces.',
        ),
    }),
    func: async ({ namespace }) => {
      try {
        const deployments = await k8sService.listResource('deployments');

        const filtered = namespace
          ? deployments.filter((d: any) => d.metadata?.namespace === namespace)
          : deployments;

        const summary = filtered.map((dep: any) => ({
          name: dep.metadata?.name,
          namespace: dep.metadata?.namespace,
          replicas: dep.spec?.replicas,
          readyReplicas: dep.status?.readyReplicas ?? 0,
          availableReplicas: dep.status?.availableReplicas ?? 0,
          updatedReplicas: dep.status?.updatedReplicas ?? 0,
          healthy: dep.status?.readyReplicas === dep.spec?.replicas,
          age: dep.metadata?.creationTimestamp,
        }));

        return JSON.stringify({
          count: filtered.length,
          deployments: summary,
        });
      } catch (error: any) {
        return JSON.stringify({
          error: error.message || 'Failed to fetch deployments',
        });
      }
    },
  });
}
