/**
 * Diagnose Pod Tool
 *
 * LangChain tool that runs AI-powered diagnosis on an unhealthy pod.
 * This allows the chat agent to trigger diagnosis conversationally.
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { diagnosePod } from '../diagnosis.service';

/**
 * Creates the diagnose pod tool.
 * Requires the user's API key since it calls OpenAI internally.
 */
export function createDiagnosePodTool(apiKey: string): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'diagnose_pod',
    description:
      'Run an AI-powered diagnosis on a pod that is having issues (not running, crash looping, pending, etc.). ' +
      'Collects pod info, events, and container logs, then analyzes them to find the root cause, ' +
      'confidence score, and recommended fixes. Use this when a user asks why a pod is failing or needs troubleshooting.',
    schema: z.object({
      name: z.string().describe('The name of the pod to diagnose'),
      namespace: z.string().describe('The namespace where the pod is located'),
    }),
    func: async ({ name, namespace }) => {
      try {
        const result = await diagnosePod({
          namespace,
          podName: name,
          apiKey,
        });

        if (result.error) {
          return JSON.stringify({ error: result.error });
        }

        if (!result.report) {
          return JSON.stringify({ error: 'Diagnosis returned no report' });
        }

        // Return a formatted summary for the chat agent
        const r = result.report;
        return JSON.stringify({
          summary: r.summary,
          rootCause: r.rootCause,
          confidence: `${r.confidence}%`,
          severity: r.severity,
          category: r.category,
          affectedContainers: r.affectedContainers,
          fixes: r.fixes.map((f) => ({
            title: f.title,
            description: f.description,
            command: f.command,
            priority: f.priority,
          })),
          preventiveMeasures: r.preventiveMeasures,
        });
      } catch (err: any) {
        return JSON.stringify({
          error: err.message || 'Failed to diagnose pod',
        });
      }
    },
  });
}
