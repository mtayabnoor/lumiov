/**
 * Agent Socket Handler
 *
 * Handles Socket.IO events for the AI cluster agent.
 */

import { Socket } from 'socket.io';
import {
  validateApiKey,
  configureSession,
  clearSession,
  removeSession,
  getSessionStatus,
  chat,
} from '../agent/agent.service';

export const registerAgentHandlers = (socket: Socket) => {
  console.log(`🧠 Agent handlers registered for: ${socket.id}`);

  // Check if session is already configured (e.g., from localStorage token)
  socket.on('agent:status', (callback: (status: { configured: boolean }) => void) => {
    const status = getSessionStatus(socket.id);
    callback(status);
  });

  // Configure the agent with an API key
  socket.on(
    'agent:configure',
    async (
      apiKey: string,
      callback: (result: { success: boolean; error?: string }) => void,
    ) => {
      console.log(`🔑 Agent configuration attempt for: ${socket.id}`);

      // Validate the API key first
      const validation = await validateApiKey(apiKey);

      if (!validation.valid) {
        callback({ success: false, error: validation.error });
        return;
      }

      // Configure the session
      configureSession(socket.id, apiKey);
      console.log(`✅ Agent configured for: ${socket.id}`);
      callback({ success: true });
    },
  );

  // Send a chat message
  socket.on(
    'agent:chat',
    async (
      payload: { message: string; allowWrite: boolean },
      callback: (result: { response?: string; error?: string }) => void,
    ) => {
      console.log(
        `💬 Agent chat from ${socket.id}: "${payload.message.substring(0, 50)}..." (allowWrite: ${payload.allowWrite})`,
      );

      const result = await chat(socket.id, payload.message, payload.allowWrite);

      if (result.error) {
        callback({ error: result.error });
      } else {
        callback({ response: result.response });
      }
    },
  );

  // Clear conversation history
  socket.on('agent:clear', (callback: () => void) => {
    clearSession(socket.id);
    console.log(`🗑️ Agent history cleared for: ${socket.id}`);
    callback();
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    removeSession(socket.id);
    console.log(`🧠 Agent session removed for: ${socket.id}`);
  });
};
