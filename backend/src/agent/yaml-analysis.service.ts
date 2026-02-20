/**
 * YAML Analysis Service
 *
 * Analyzes Kubernetes YAML manifests using OpenAI GPT-4o for:
 * - Syntax & formatting issues
 * - Security vulnerabilities
 * - Best practice violations
 * - Optimization opportunities
 *
 * Returns structured suggestions with inline diff data for
 * Cursor-style accept/reject UX.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

// ─── Structured Output Schema ──────────────────────────────────

const YamlSuggestionSchema = z.object({
  id: z.string().describe('Unique identifier for this suggestion (e.g., "s1", "s2")'),
  type: z
    .enum(['syntax', 'security', 'best-practice', 'optimization'])
    .describe('Category of the suggestion'),
  severity: z
    .enum(['critical', 'warning', 'info'])
    .describe('How urgent or important this suggestion is'),
  title: z.string().describe('Short, descriptive title for the suggestion'),
  description: z
    .string()
    .describe('Detailed explanation of the issue and why the change is recommended'),
  lineStart: z
    .number()
    .describe(
      'Starting line number (1-indexed) of the affected code in the original YAML',
    ),
  lineEnd: z
    .number()
    .describe('Ending line number (1-indexed) of the affected code in the original YAML'),
  originalCode: z
    .string()
    .describe(
      'The exact original YAML snippet that should be replaced (must match the source exactly)',
    ),
  suggestedCode: z
    .string()
    .describe('The improved YAML snippet that should replace the original'),
  rationale: z
    .string()
    .describe('Brief explanation of why this specific change improves the manifest'),
});

const YamlAnalysisResponseSchema = z.object({
  suggestions: z
    .array(YamlSuggestionSchema)
    .describe('List of actionable suggestions, ordered by severity (critical first)'),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overall quality score of the YAML manifest from 0-100'),
  summary: z
    .string()
    .describe(
      'One-sentence summary of the overall state of the manifest (e.g., "Generally well-structured but has 2 security issues")',
    ),
});

export type YamlSuggestion = z.infer<typeof YamlSuggestionSchema>;
export type YamlAnalysisResponse = z.infer<typeof YamlAnalysisResponseSchema>;

// ─── Analysis Prompt ───────────────────────────────────────────

const YAML_ANALYSIS_SYSTEM_PROMPT = `You are an expert Kubernetes YAML auditor and security engineer. You analyze Kubernetes manifests and return structured, actionable suggestions.

Your analysis covers four categories:

1. **Syntax & Formatting**: Indentation errors, invalid YAML structures, deprecated API versions, incorrect field names.

2. **Security**: Exposed secrets in plain text, containers running as root, missing security contexts, overly permissive RBAC, missing network policies, privileged containers, host path mounts, missing resource limits.

3. **Best Practices**: Missing labels/annotations, missing readiness/liveness probes, missing resource requests/limits, not using specific image tags (avoid :latest), missing namespace declarations, duplicated configuration that could use YAML anchors.

4. **Optimization**: Excessive resource requests, unnecessary environment variables, redundant configurations, opportunities to use YAML anchors (&/<<:) for DRY code.

CRITICAL RULES:
- The "originalCode" field MUST be an EXACT character-for-character substring of the input YAML. Do not paraphrase or reformat it.
- The "suggestedCode" field must be valid YAML that can directly replace the originalCode.
- Line numbers must be accurate (1-indexed).
- Order suggestions by severity: critical first, then warning, then info.
- Be specific and actionable — don't give vague advice.
- If the YAML is perfect, return an empty suggestions array with a high score.
- Maximum 15 suggestions to avoid overwhelming the user.`;

// ─── Main Analysis Function ────────────────────────────────────

export interface YamlAnalysisRequest {
  yaml: string;
  apiKey: string;
}

export interface YamlAnalysisResult {
  response?: YamlAnalysisResponse;
  error?: string;
}

// Max YAML size: 100KB
const MAX_YAML_SIZE = 100 * 1024;

// Request timeout: 60 seconds
const REQUEST_TIMEOUT_MS = 60_000;

export async function analyzeYaml(req: YamlAnalysisRequest): Promise<YamlAnalysisResult> {
  const { yaml: yamlContent, apiKey } = req;

  // ── Input Validation ─────────────────────────────────────────
  if (!yamlContent || yamlContent.trim().length === 0) {
    return { error: 'YAML content is empty. Nothing to analyze.' };
  }

  if (yamlContent.length > MAX_YAML_SIZE) {
    return {
      error: `YAML content exceeds maximum size of ${MAX_YAML_SIZE / 1024}KB.`,
    };
  }

  if (!apiKey || apiKey.trim().length === 0) {
    return { error: 'API key is required for AI analysis.' };
  }

  console.log(
    `🔍 Starting YAML analysis (${yamlContent.split('\n').length} lines, ${yamlContent.length} bytes)`,
  );

  try {
    const model = new ChatOpenAI({
      apiKey,
      model: 'gpt-4o',
      temperature: 0.1,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const structuredModel = model.withStructuredOutput(YamlAnalysisResponseSchema);

    const prompt = `${YAML_ANALYSIS_SYSTEM_PROMPT}

--- YAML MANIFEST TO ANALYZE ---
\`\`\`yaml
${yamlContent}
\`\`\`
--- END YAML ---

Analyze the above YAML manifest and provide structured suggestions.`;

    const response = await structuredModel.invoke([new HumanMessage(prompt)]);

    console.log(
      `✅ YAML analysis complete: ${response.suggestions.length} suggestions, score: ${response.overallScore}/100`,
    );

    return { response };
  } catch (error: any) {
    console.error('❌ YAML analysis error:', error.message);

    if (error.message?.includes('401') || error.message?.includes('invalid_api_key')) {
      return { error: 'Invalid OpenAI API key. Please reconfigure in the AI settings.' };
    }
    if (error.message?.includes('429')) {
      return { error: 'Rate limited by OpenAI. Please wait a moment and try again.' };
    }
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return {
        error: 'Analysis timed out. The YAML may be too complex. Try a smaller manifest.',
      };
    }

    return { error: error.message || 'AI analysis failed unexpectedly.' };
  }
}
