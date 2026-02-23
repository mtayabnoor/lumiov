/**
 * YAML Analysis Interfaces
 *
 * TypeScript types for the AI-powered YAML analysis feature.
 * Mirrors the backend Zod schema from yaml-analysis.service.ts.
 */

export type SuggestionType = 'syntax' | 'security' | 'best-practice' | 'optimization';
export type SuggestionSeverity = 'critical' | 'warning' | 'info';

export interface YamlSuggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  originalCode: string;
  suggestedCode: string;
  rationale: string;
}

export interface YamlAnalysisResponse {
  suggestions: YamlSuggestion[];
  overallScore: number;
  summary: string;
}
