/**
 * Agent Service
 *
 * Public API consumed by agent.handler.ts (Socket.IO handler).
 * Thin orchestrator — delegates each concern to a focused module:
 *
 *   session.store.ts     → per-socket session lifecycle (CRUD, cleanup)
 *   agent.prompt.ts      → system prompt and write-permission rules
 *   safety-policy.service.ts → guardrails and pending-action helpers
 *   tools/index.ts       → all available LangChain tools
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import {
  createSession,
  getSession,
  hasSession,
  clearSessionHistory,
  deleteSession,
  type AgentSession,
} from './session.store';
import { buildSystemPrompt } from './agent.prompt';
import { createAllTools } from './tools/index';
import { k8sService } from '../services/kubernetes.service';
import {
  buildConfirmationMessage,
  isPendingActionExpired,
  type PendingAction,
} from './safety/safety-policy.service';

// ─── Public API ───────────────────────────────────────────────

/**
 * Validates an OpenAI API key by making a minimal test request.
 */
export async function validateApiKey(
  apiKey: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const model = new ChatOpenAI({ apiKey, model: 'gpt-4o-mini', maxTokens: 10 });
    await model.invoke([new HumanMessage('test')]);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: mapLLMError(error) };
  }
}

/** Creates a new session for the socket, replacing any existing one. */
export function configureSession(socketId: string, apiKey: string): void {
  createSession(socketId, apiKey);
}

/** Resets conversation history for a socket, keeping the API key. */
export function clearSession(socketId: string): void {
  clearSessionHistory(socketId);
}

/** Removes the session entirely (called on socket disconnect). */
export function removeSession(socketId: string): void {
  deleteSession(socketId);
}

/** Returns whether a socket has a configured session. */
export function getSessionStatus(socketId: string): { configured: boolean } {
  return { configured: hasSession(socketId) };
}

/**
 * Processes a user chat message and returns the AI response.
 * Handles the safety confirmation flow before delegating to the LangChain agent.
 */
export async function chat(
  socketId: string,
  message: string,
  allowWrite: boolean,
): Promise<{ response: string; error?: string }> {
  const session = getSession(socketId);

  if (!session) {
    return {
      response: '',
      error: 'Session not configured. Please set your API key first.',
    };
  }

  session.lastActivity = Date.now();

  try {
    const confirmationResult = await handleConfirmationFlow(
      message.trim(),
      session,
      allowWrite,
    );
    if (confirmationResult !== null) return confirmationResult;

    return await invokeAgent(session, message.trim(), allowWrite);
  } catch (error: any) {
    console.error('Agent chat error:', error);
    return { response: '', error: mapLLMError(error) };
  }
}

// ─── Confirmation Flow ────────────────────────────────────────

/**
 * Handles all pending-action states before the agent is invoked.
 * Returns a result object when the message was consumed by the confirmation flow,
 * or null when the message should be forwarded to the LangChain agent.
 */
async function handleConfirmationFlow(
  message: string,
  session: AgentSession,
  allowWrite: boolean,
): Promise<{ response: string; error?: string } | null> {
  if (!session.pendingAction) return null;

  // 1. Expired — clear and tell the user to re-run
  if (isPendingActionExpired(session.pendingAction)) {
    session.pendingAction = null;
    return {
      response: 'The pending safety confirmation expired. Please re-run your request.',
    };
  }

  // 2. User typed "cancel"
  if (/^cancel$/i.test(message)) {
    const canceled = session.pendingAction;
    session.pendingAction = null;
    return { response: `Canceled action: ${canceled.summary}` };
  }

  // 3. User typed "confirm <uuid>"
  const confirmMatch = message.match(/^confirm\s+([a-f0-9-]{8,})$/i);
  if (confirmMatch) {
    const confirmedId = confirmMatch[1];

    if (session.pendingAction.id !== confirmedId) {
      return {
        response: [
          'Confirmation ID does not match the pending action.',
          buildConfirmationMessage(session.pendingAction),
        ].join('\n'),
      };
    }

    if (!allowWrite) {
      session.pendingAction = null;
      return { response: '', error: 'Write actions are disabled in settings.' };
    }

    const action = session.pendingAction;
    session.pendingAction = null;
    const executionMessage = await executePendingAction(action);
    return { response: executionMessage };
  }

  // 4. Some other message while an action is pending — re-show the prompt
  return { response: buildConfirmationMessage(session.pendingAction) };
}

// ─── Agent Invocation ─────────────────────────────────────────

/**
 * Builds the LangChain agent, invokes it with the conversation history,
 * and manages history trimming. If the tool registered a pending action
 * during invocation, the response is overridden with the confirmation prompt.
 */
async function invokeAgent(
  session: AgentSession,
  message: string,
  allowWrite: boolean,
): Promise<{ response: string; error?: string }> {
  const model = new ChatOpenAI({
    apiKey: session.apiKey,
    model: 'gpt-4o',
    temperature: 0.1,
  });

  const tools = createAllTools(session.apiKey, allowWrite, {
    setPendingAction: (action) => {
      session.pendingAction = action;
    },
  });

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: buildSystemPrompt(allowWrite),
  });

  session.history.push(new HumanMessage(message));

  const result = await agent.invoke({ messages: session.history });

  const lastMessage = result.messages[result.messages.length - 1];
  let response =
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  // If a tool registered a pending action, always override the response with
  // the confirmation prompt so the user sees the confirm/cancel instructions.
  if (session.pendingAction) {
    response = buildConfirmationMessage(session.pendingAction);
  }

  session.history.push(new AIMessage(response));

  // Keep history bounded to avoid runaway token usage
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  return { response };
}

// ─── Pending Action Executor ──────────────────────────────────

/**
 * Executes a user-confirmed pending action against the Kubernetes API.
 * Throws on unsupported action types or missing parameters.
 */
async function executePendingAction(action: PendingAction): Promise<string> {
  if (action.type === 'scale_deployment') {
    if (typeof action.params.replicas !== 'number') {
      throw new Error('Pending scale action is missing replicas value.');
    }
    return k8sService.scaleDeployment(
      action.params.name,
      action.params.namespace,
      action.params.replicas,
    );
  }

  if (action.type === 'delete_pod') {
    await k8sService.deleteResourceGeneric(
      'v1',
      'Pod',
      action.params.name,
      action.params.namespace,
    );
    return `Pod ${action.params.name} in namespace ${action.params.namespace} deleted successfully.`;
  }

  throw new Error(`Unsupported pending action type: ${action.type}`);
}

// ─── Error Classifier ─────────────────────────────────────────

/**
 * Maps raw OpenAI / network errors into user-friendly messages.
 * Used by both validateApiKey() and the chat() error handler.
 */
function mapLLMError(error: any): string {
  const message: string = error?.message ?? 'Unknown error';
  if (message.includes('401') || message.includes('invalid_api_key')) {
    return 'API key is invalid or expired. Please reconfigure.';
  }
  if (message.includes('429')) {
    return 'Rate limited by OpenAI. Please try again in a moment.';
  }
  return message || 'Failed to process message';
}
