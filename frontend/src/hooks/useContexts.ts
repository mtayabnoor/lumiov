import { useState, useEffect, useCallback } from 'react';

import { API_PATH } from '../config/api';
const API_BASE = API_PATH;

export interface KubeContext {
  name: string;
  cluster: string;
  user: string;
}

interface ContextsState {
  contexts: KubeContext[];
  currentContext: string;
  loading: boolean;
  switching: boolean;
  error: string | null;
}

export function useContexts() {
  const [state, setState] = useState<ContextsState>({
    contexts: [],
    currentContext: '',
    loading: true,
    switching: false,
    error: null,
  });

  // Fetch available contexts on mount
  useEffect(() => {
    const fetchContexts = async () => {
      try {
        const res = await fetch(`${API_BASE}/contexts`);
        if (!res.ok) throw new Error('Failed to fetch contexts');
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          contexts: data.contexts,
          currentContext: data.current,
          loading: false,
          error: null,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch contexts',
        }));
      }
    };

    fetchContexts();
  }, []);

  // Switch context → backend re-initializes → page reloads
  const switchContext = useCallback(async (contextName: string) => {
    setState((prev) => ({ ...prev, switching: true, error: null }));

    try {
      const res = await fetch(`${API_BASE}/contexts/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: contextName }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Context switch failed');
      }

      // Reload to force all resource hooks to re-subscribe against the new cluster
      window.location.reload();
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        switching: false,
        error: err.message || 'Context switch failed',
      }));
    }
  }, []);

  return {
    contexts: state.contexts,
    currentContext: state.currentContext,
    loading: state.loading,
    switching: state.switching,
    error: state.error,
    switchContext,
  };
}
