/**
 * Agent Service
 *
 * Core LangChain agent service that manages conversations and tool execution.
 * Designed for scalability - new tools are automatically picked up from the tools directory.
 */

import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { createAllTools } from './tools/index';

// Store for per-user agent instances and conversation history
interface AgentSession {
  apiKey: string;
  history: BaseMessage[];
  lastActivity: number;
}

// Simple in-memory session store (could be Redis in production)
const sessions = new Map<string, AgentSession>();

// Session timeout: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * System prompt that instructs the AI how to behave
 */
const SYSTEM_PROMPT = `You are Lumiov AI, an intelligent assistant for Kubernetes cluster management.

Your capabilities:
- Fetch and analyze pod information (status, restarts, resource usage)
- Monitor deployment health and replica counts
- List and describe namespaces
- Provide insights about cluster health
- Diagnose pod issues

Response Formatting Guidelines:
1. Always use bullet points (•) for lists
2. Use **bold** for important names, counts, and status values
3. Start with a brief summary line, then provide details
4. Group related information together
5. For issues, use ⚠️ emoji to highlight warnings
6. For healthy items, use ✅ emoji
7. Keep responses concise but informative

Example response format:
"You have **12 pods** across **3 namespaces**.

**Healthy:**
• ✅ nginx-deployment: 3/3 replicas ready
• ✅ redis: 1/1 ready

**Issues:**
• ⚠️ api-server: 2 restarts in the last hour"

Guidelines:
1. Always use the available tools to get real-time data before answering questions
2. If you detect issues (pending pods, restart loops, unhealthy deployments), proactively mention them
3. If a tool returns an error, explain what went wrong and suggest solutions
4. Never answer questions about deleting pods, scaling deployments, or any other action that modifies the cluster state. You are only allowed to provide information about the cluster state.
5. Never answer questions not related to Kubernetes operations.

You are helpful, accurate, and focused on Kubernetes operations.`;

/**
 * Validates an OpenAI API key by making a test request
 */
export async function validateApiKey(
  apiKey: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const model = new ChatOpenAI({
      apiKey: apiKey,
      model: 'gpt-4o-mini',
      maxTokens: 10,
    });

    await model.invoke([new HumanMessage('test')]);
    return { valid: true };
  } catch (error: any) {
    const message = error.message || 'Invalid API key';
    if (message.includes('401') || message.includes('invalid_api_key')) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your OpenAI API key.',
      };
    }
    if (message.includes('429')) {
      return { valid: false, error: 'Rate limited. Please try again later.' };
    }
    return { valid: false, error: message };
  }
}

/**
 * Creates or retrieves an agent session for a socket
 */
export function configureSession(socketId: string, apiKey: string): void {
  sessions.set(socketId, {
    apiKey,
    history: [],
    lastActivity: Date.now(),
  });
}

/**
 * Clears a session's conversation history
 */
export function clearSession(socketId: string): void {
  const session = sessions.get(socketId);
  if (session) {
    session.history = [];
    session.lastActivity = Date.now();
  }
}

/**
 * Removes a session entirely
 */
export function removeSession(socketId: string): void {
  sessions.delete(socketId);
}

/**
 * Gets session status
 */
export function getSessionStatus(socketId: string): { configured: boolean } {
  return { configured: sessions.has(socketId) };
}

/**
 * Processes a chat message and returns the AI response
 */
export async function chat(
  socketId: string,
  message: string,
): Promise<{ response: string; error?: string }> {
  const session = sessions.get(socketId);

  if (!session) {
    return {
      response: '',
      error: 'Session not configured. Please set your API key first.',
    };
  }

  try {
    session.lastActivity = Date.now();

    // Create the model with the user's API key
    const model = new ChatOpenAI({
      apiKey: session.apiKey,
      model: 'gpt-4o',
      temperature: 0.1,
    });

    // Get all available tools (pass apiKey so diagnose tool is available)
    const tools = createAllTools(session.apiKey);

    // Create the agent
    const agent = createReactAgent({
      llm: model,
      tools,
      messageModifier: SYSTEM_PROMPT,
    });

    // Add user message to history
    session.history.push(new HumanMessage(message));

    // Invoke the agent with conversation history
    const result = await agent.invoke({
      messages: session.history,
    });

    // Extract the AI response
    const lastMessage = result.messages[result.messages.length - 1];
    const response =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Add AI response to history
    session.history.push(new AIMessage(response));

    // Keep history manageable (last 20 messages)
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    return { response };
  } catch (error: any) {
    console.error('Agent chat error:', error);

    if (error.message?.includes('401')) {
      return {
        response: '',
        error: 'API key is invalid or expired. Please reconfigure.',
      };
    }
    if (error.message?.includes('429')) {
      return {
        response: '',
        error: 'Rate limited by OpenAI. Please try again in a moment.',
      };
    }

    return {
      response: '',
      error: error.message || 'Failed to process message',
    };
  }
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [socketId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      sessions.delete(socketId);
      console.log(`Cleaned up expired agent session: ${socketId}`);
    }
  }
}, 60000); // Check every minute
