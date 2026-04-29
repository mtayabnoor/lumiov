/**
 * useYamlAnalysis Hook
 *
 * Encapsulates AI YAML analysis API calls with loading/error state,
 * suggestion management (accept/reject), and abort handling.
 */

import { useState, useCallback, useRef } from 'react';
import type { YamlSuggestion, YamlAnalysisResponse } from '../interfaces/yaml-analysis';

import { API_PATH } from '../config/api';
import { secureRetrieveKey } from '../services/secureStorage';
const API_BASE = API_PATH;

interface UseYamlAnalysisReturn {
  /** Trigger AI analysis of the given YAML content */
  analyzeYaml: (content: string) => Promise<void>;
  /** Accept a suggestion (removes from pending, returns the patch) */
  acceptSuggestion: (id: string) => YamlSuggestion | undefined;
  /** Reject a suggestion (removes from pending) */
  rejectSuggestion: (id: string) => void;
  /** Accept all remaining suggestions */
  acceptAll: () => YamlSuggestion[];
  /** Reject all remaining suggestions */
  rejectAll: () => void;
  /** Cancel an in-flight analysis request */
  cancel: () => void;
  /** Reset all state */
  reset: () => void;

  // State
  suggestions: YamlSuggestion[];
  overallScore: number | null;
  summary: string | null;
  loading: boolean;
  error: string | null;
  isApiKeyMissing: boolean;
}

export function useYamlAnalysis(): UseYamlAnalysisReturn {
  const [suggestions, setSuggestions] = useState<YamlSuggestion[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeYaml = useCallback(async (content: string) => {
    const apiKey = await secureRetrieveKey();

    if (!apiKey) {
      setIsApiKeyMissing(true);
      setError('No OpenAI API key configured.');
      return;
    }

    setIsApiKeyMissing(false);

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setSuggestions([]);
    setOverallScore(null);
    setSummary(null);

    try {
      const res = await fetch(`${API_BASE}/analyze-yaml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: content, apiKey }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Analysis request failed' }));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data: YamlAnalysisResponse = await res.json();

      setSuggestions(data.suggestions);
      setOverallScore(data.overallScore);
      setSummary(data.summary);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      setError(err.message || 'Failed to analyze YAML');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const acceptSuggestion = useCallback((id: string): YamlSuggestion | undefined => {
    let accepted: YamlSuggestion | undefined;
    setSuggestions((prev) => {
      accepted = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });
    return accepted;
  }, []);

  const rejectSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const acceptAll = useCallback((): YamlSuggestion[] => {
    let allSuggestions: YamlSuggestion[] = [];
    setSuggestions((prev) => {
      allSuggestions = [...prev];
      return [];
    });
    return allSuggestions;
  }, []);

  const rejectAll = useCallback(() => {
    setSuggestions([]);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setSuggestions([]);
    setOverallScore(null);
    setSummary(null);
    setError(null);
    setIsApiKeyMissing(false);
  }, [cancel]);

  return {
    analyzeYaml,
    acceptSuggestion,
    rejectSuggestion,
    acceptAll,
    rejectAll,
    cancel,
    reset,
    suggestions,
    overallScore,
    summary,
    loading,
    error,
    isApiKeyMissing,
  };
}
