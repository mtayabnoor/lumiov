/**
 * Agent Session Store
 *
 * In-memory store for per-socket agent sessions.
 * Each session holds the user's API key, LangChain message history,
 * and any pending safety action awaiting confirmation.
 *
 * In a multi-instance deployment, replace this store with Redis.
 */

import type { BaseMessage } from '@langchain/core/messages';
import type { PendingAction } from './safety/safety-policy.service';

// ─── Session Type ──────────────────────────────────────────────

export interface AgentSession {
  apiKey: string;
  history: BaseMessage[];
  lastActivity: number;
  /** Non-null when a risky action is waiting for user confirmation. */
  pendingAction: PendingAction | null;
}

// ─── Constants ────────────────────────────────────────────────

/** Sessions idle longer than this are purged automatically. */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─── Store ────────────────────────────────────────────────────

const sessions = new Map<string, AgentSession>();

// ─── CRUD ─────────────────────────────────────────────────────

export function createSession(socketId: string, apiKey: string): void {
  sessions.set(socketId, {
    apiKey,
    history: [],
    lastActivity: Date.now(),
    pendingAction: null,
  });
}

export function getSession(socketId: string): AgentSession | undefined {
  return sessions.get(socketId);
}

export function hasSession(socketId: string): boolean {
  return sessions.has(socketId);
}

/**
 * Wipes conversation history and clears any pending action.
 * Keeps the API key so the session stays configured.
 */
export function clearSessionHistory(socketId: string): void {
  const session = sessions.get(socketId);
  if (session) {
    session.history = [];
    session.pendingAction = null;
    session.lastActivity = Date.now();
  }
}

export function deleteSession(socketId: string): void {
  sessions.delete(socketId);
}

// ─── Background Cleanup ───────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [socketId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      sessions.delete(socketId);
      console.log(`🧹 Expired agent session removed: ${socketId}`);
    }
  }
}, 60_000);
