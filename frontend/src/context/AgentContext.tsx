/**
 * Agent Context
 *
 * Manages the AI cluster agent state across the application.
 * Handles API token configuration and chat panel visibility.
 */

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

// Message types for the chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

interface AgentContextType {
  // Configuration state
  isConfigured: boolean;
  isConfiguring: boolean;
  configError: string | null;

  // Chat panel state
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  // Configuration modal state
  isConfigModalOpen: boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;

  // Chat state
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;

  // Configuration
  configureAgent: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  resetConfiguration: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'lumiov-agent-api-key';

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const socket = useSocket();

  // Configuration state
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate unique message IDs
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Try to restore configuration on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey && socket) {
      // Attempt to reconfigure with stored key
      socket.emit(
        'agent:configure',
        storedKey,
        (result: { success: boolean; error?: string }) => {
          if (result.success) {
            setIsConfigured(true);
          } else {
            // Key is no longer valid, remove it
            localStorage.removeItem(API_KEY_STORAGE_KEY);
          }
        },
      );
    }
  }, [socket]);

  // Configure the agent with an API key
  const configureAgent = async (
    apiKey: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!socket) {
      return { success: false, error: 'Not connected to server' };
    }

    setIsConfiguring(true);
    setConfigError(null);

    // We wrap the socket callback in a Promise so the UI can 'await' the result.
    return new Promise((resolve) => {
      socket.emit(
        'agent:configure',
        apiKey,
        (result: { success: boolean; error?: string }) => {
          setIsConfiguring(false);

          if (result.success) {
            setIsConfigured(true);
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
            setIsConfigModalOpen(false);
            setIsChatOpen(true); // Open chat panel automatically
            resolve({ success: true });
          } else {
            const errorMsg = result.error || 'Configuration failed';
            setConfigError(errorMsg);
            resolve({ success: false, error: errorMsg });
          }
        },
      );
    });
  };

  // Reset configuration
  const resetConfiguration = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setIsConfigured(false);
    setMessages([]);
    setConfigError(null);
    setIsChatOpen(false); // Close chat panel
    setIsConfigModalOpen(false); // Close config modal
  };

  // Send a chat message
  const sendMessage = async (content: string) => {
    if (!socket || !isConfigured || !content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    socket.emit(
      'agent:chat',
      content.trim(),
      (result: { response?: string; error?: string }) => {
        setIsLoading(false);

        if (result.error) {
          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'error',
            content: result.error,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else if (result.response) {
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: result.response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      },
    );
  };

  // Clear chat history
  const clearHistory = () => {
    if (!socket) return;

    socket.emit('agent:clear', () => {
      setMessages([]);
    });
  };

  // Panel controls
  const openChat = () => {
    if (isConfigured) {
      setIsChatOpen(true);
    } else {
      setIsConfigModalOpen(true);
    }
  };

  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => {
    if (isConfigured) {
      setIsChatOpen((prev) => !prev);
    } else {
      setIsConfigModalOpen(true);
    }
  };

  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => {
    setIsConfigModalOpen(false);
    setConfigError(null);
  };

  return (
    <AgentContext.Provider
      value={{
        isConfigured,
        isConfiguring,
        configError,
        isChatOpen,
        openChat,
        closeChat,
        toggleChat,
        isConfigModalOpen,
        openConfigModal,
        closeConfigModal,
        messages,
        isLoading,
        sendMessage,
        clearHistory,
        configureAgent,
        resetConfiguration,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}
