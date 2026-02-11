/**
 * Diagnosis Report Interfaces
 *
 * Matches the backend Zod schema for AI-powered pod diagnosis.
 */

export interface TimelineEvent {
  timestamp: string;
  event: string;
}

export interface Fix {
  title: string;
  description: string;
  command: string | null;
  priority: "immediate" | "short-term" | "long-term";
  risk: "low" | "medium" | "high";
}

export interface DiagnosisReport {
  summary: string;
  rootCause: string;
  confidence: number;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  affectedContainers: string[];
  timeline: TimelineEvent[];
  fixes: Fix[];
  preventiveMeasures: string[];
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
