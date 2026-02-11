/**
 * Diagnosis Service
 *
 * Collects Kubernetes diagnostic data (pod info, events, logs) and sends it
 * to OpenAI for structured analysis. Returns a typed DiagnosisReport with
 * root cause, confidence score, fixes, and preventive measures.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { k8sService } from '../services/kubernetes.service';

// ─── Structured Output Schema ──────────────────────────────────

const TimelineEventSchema = z.object({
  timestamp: z.string().describe('ISO timestamp or relative time of the event'),
  event: z.string().describe('Description of what happened'),
});

const FixSchema = z.object({
  title: z.string().describe('Short title for the fix'),
  description: z
    .string()
    .describe('Detailed description of the fix and why it helps'),
  command: z
    .string()
    .nullable()
    .describe(
      'kubectl command or YAML snippet to apply the fix, or null if not applicable',
    ),
  priority: z
    .enum(['immediate', 'short-term', 'long-term'])
    .describe('How urgently this fix should be applied'),
  risk: z
    .enum(['low', 'medium', 'high'])
    .describe('Risk level of applying this fix'),
});

const DiagnosisReportSchema = z.object({
  summary: z
    .string()
    .describe('One-paragraph executive summary of the pod issue'),
  rootCause: z.string().describe('The most likely root cause of the problem'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence score from 0-100 in the diagnosis'),
  severity: z
    .enum(['critical', 'high', 'medium', 'low'])
    .describe('Severity level of the issue'),
  category: z
    .string()
    .describe(
      'Category of the issue, e.g. ImagePull, CrashLoop, ResourceLimit, Configuration, Network, Scheduling',
    ),
  affectedContainers: z
    .array(z.string())
    .describe('List of container names affected by the issue'),
  timeline: z
    .array(TimelineEventSchema)
    .describe('Chronological timeline of events leading to the issue'),
  fixes: z
    .array(FixSchema)
    .describe(
      'Recommended fixes ordered by priority. Include practical kubectl commands where possible.',
    ),
  preventiveMeasures: z
    .array(z.string())
    .describe('Long-term preventive measures to avoid this issue recurring'),
});

export type DiagnosisReport = z.infer<typeof DiagnosisReportSchema>;

// ─── Diagnosis Prompt ──────────────────────────────────────────

const DIAGNOSIS_SYSTEM_PROMPT = `You are an expert Kubernetes diagnostician. You are given raw diagnostic data about a pod that is experiencing issues.

Analyze ALL provided data carefully:
- Pod status, phase, and conditions
- Container statuses (waiting reasons, termination info, restart counts)  
- Kubernetes events (scheduling, pulling, errors)
- Container logs (error messages, stack traces, crash info)

Provide a thorough, structured diagnosis. Be specific about the root cause — don't be vague.
If there are multiple potential causes, pick the most likely one and reflect your certainty in the confidence score.
For fixes, always include practical kubectl commands when applicable.`;

// ─── Main Diagnosis Function ───────────────────────────────────

export interface DiagnosisRequest {
  namespace: string;
  podName: string;
  apiKey: string;
}

export interface DiagnosisResult {
  report?: DiagnosisReport;
  rawData: {
    podInfo: any;
    events: any[];
    containerLogs: Record<string, string>;
  };
  error?: string;
}

export async function diagnosePod(
  req: DiagnosisRequest,
): Promise<DiagnosisResult> {
  const { namespace, podName, apiKey } = req;

  console.log(`🔬 Starting diagnosis for pod: ${namespace}/${podName}`);

  // ── 1. Collect all diagnostic data ───────────────────────────

  // Get pod details
  const pods = await k8sService.listResource('pods');
  const pod = pods.find(
    (p: any) =>
      p.metadata?.name === podName && p.metadata?.namespace === namespace,
  );

  if (!pod) {
    return {
      rawData: { podInfo: null, events: [], containerLogs: {} },
      error: `Pod ${podName} not found in namespace ${namespace}`,
    };
  }

  // Get events
  const events = await k8sService.getPodEvents(namespace, podName);

  // Get logs for each container
  const containerLogs: Record<string, string> = {};
  const containers = pod.spec?.containers ?? [];

  for (const container of containers) {
    const name = container.name;

    // Current logs
    const currentLogs = await k8sService.getPodLogsSnapshot(
      namespace,
      podName,
      name,
      150,
      false,
    );
    containerLogs[name] = currentLogs;

    // Previous container logs (for crash loops)
    const previousLogs = await k8sService.getPodLogsSnapshot(
      namespace,
      podName,
      name,
      50,
      true,
    );
    if (previousLogs) {
      containerLogs[`${name} (previous)`] = previousLogs;
    }
  }

  // Extract relevant pod info
  const podInfo = {
    name: pod.metadata?.name,
    namespace: pod.metadata?.namespace,
    phase: pod.status?.phase,
    conditions: pod.status?.conditions,
    containerStatuses: pod.status?.containerStatuses?.map((cs: any) => ({
      name: cs.name,
      ready: cs.ready,
      started: cs.started,
      restartCount: cs.restartCount,
      state: cs.state,
      lastState: cs.lastState,
    })),
    initContainerStatuses: pod.status?.initContainerStatuses?.map(
      (cs: any) => ({
        name: cs.name,
        ready: cs.ready,
        restartCount: cs.restartCount,
        state: cs.state,
        lastState: cs.lastState,
      }),
    ),
    nodeName: pod.spec?.nodeName,
    nodeSelector: pod.spec?.nodeSelector,
    tolerations: pod.spec?.tolerations,
    containers: containers.map((c: any) => ({
      name: c.name,
      image: c.image,
      resources: c.resources,
      ports: c.ports,
      env: c.env?.slice(0, 10), // Limit env vars to avoid token overload
    })),
    creationTimestamp: pod.metadata?.creationTimestamp,
  };

  const rawData = { podInfo, events, containerLogs };

  // ── 2. Build prompt and call AI ──────────────────────────────

  try {
    const model = new ChatOpenAI({
      apiKey,
      model: 'gpt-4o',
      temperature: 0.1,
    });

    const structuredModel = model.withStructuredOutput(DiagnosisReportSchema);

    // Build the diagnostic prompt
    const diagnosticData = `
## Pod Information
\`\`\`json
${JSON.stringify(podInfo, null, 2)}
\`\`\`

## Kubernetes Events (${events.length} events)
\`\`\`json
${JSON.stringify(events, null, 2)}
\`\`\`

## Container Logs
${Object.entries(containerLogs)
  .map(
    ([name, logs]) =>
      `### ${name}\n\`\`\`\n${logs || '(no logs available)'}\n\`\`\``,
  )
  .join('\n\n')}
`;

    const prompt = `${DIAGNOSIS_SYSTEM_PROMPT}

--- DIAGNOSTIC DATA ---
${diagnosticData}
--- END DATA ---

Analyze the above data and provide a structured diagnosis.`;

    const report = await structuredModel.invoke([new HumanMessage(prompt)]);

    console.log(
      `✅ Diagnosis complete for ${podName}: ${report.severity} severity, ${report.confidence}% confidence`,
    );

    return { report, rawData };
  } catch (error: any) {
    console.error('❌ Diagnosis AI error:', error.message);
    return {
      rawData,
      error: error.message?.includes('401')
        ? 'Invalid OpenAI API key. Please reconfigure.'
        : error.message || 'AI analysis failed',
    };
  }
}
