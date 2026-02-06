/**
 * Describe Pod Tool
 *
 * Gets detailed information about a specific pod.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { k8sService } from '../../services/kubernetes.service.js';

export function createDescribePodTool(): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'describe_pod',
    description:
      'Get detailed information about a specific pod including containers, volumes, and events. Use this when asked for details about a particular pod.',
    schema: z.object({
      name: z.string().describe('The name of the pod to describe'),
      namespace: z.string().describe('The namespace where the pod is located'),
    }),
    func: async ({ name, namespace }) => {
      try {
        const pods = await k8sService.listResource('pods');

        const pod = pods.find(
          (p: any) =>
            p.metadata?.name === name && p.metadata?.namespace === namespace,
        );

        if (!pod) {
          return JSON.stringify({
            error: `Pod ${name} not found in namespace ${namespace}`,
          });
        }

        // Extract detailed information
        const details = {
          name: pod.metadata?.name,
          namespace: pod.metadata?.namespace,
          status: pod.status?.phase,
          node: pod.spec?.nodeName,
          ip: pod.status?.podIP,
          hostIP: pod.status?.hostIP,
          startTime: pod.status?.startTime,
          containers: pod.spec?.containers?.map((c: any) => ({
            name: c.name,
            image: c.image,
            ports: c.ports?.map((p: any) => `${p.containerPort}/${p.protocol}`),
            resources: c.resources,
          })),
          containerStatuses: pod.status?.containerStatuses?.map((cs: any) => ({
            name: cs.name,
            ready: cs.ready,
            restartCount: cs.restartCount,
            state: Object.keys(cs.state || {})[0],
          })),
          conditions: pod.status?.conditions?.map((c: any) => ({
            type: c.type,
            status: c.status,
            reason: c.reason,
          })),
          labels: pod.metadata?.labels,
        };

        return JSON.stringify(details);
      } catch (error: any) {
        return JSON.stringify({
          error: error.message || 'Failed to describe pod',
        });
      }
    },
  });
}
