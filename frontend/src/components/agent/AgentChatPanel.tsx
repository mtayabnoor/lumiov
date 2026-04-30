/**
 * Agent Chat Panel
 *
 * Sliding drawer panel for chatting with the AI cluster assistant.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Drawer, Box, Typography, TextField, IconButton, Tooltip, Divider, Paper, CircularProgress, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useAgent, type ChatMessage } from '../../context/AgentContext';
import AgentStatusIcon from './AgentStatusIcon';
import { AGENT_CHAT_DRAWER_WIDTH, APP_HEADER_HEIGHT, APP_HEADER_HEIGHT_PX } from '../layout/layoutConstants';

const SCROLL_THRESHOLD_PX = 96;
const COMPOSER_HELPER_ID = 'agent-chat-composer-hint';

interface MessageBubbleProps {
  message: ChatMessage;
  isConfigured: boolean;
  copiedMessageId: string | null;
  onCopy: (message: ChatMessage) => void;
}

function MessageBubble({ message, isConfigured, copiedMessageId, onCopy }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isAssistant = message.role === 'assistant';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        mb: 2.5,
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? 'primary.main' : isError ? 'error.main' : 'primary.main',
        }}
      >
        {isUser ? (
          <PersonIcon sx={{ fontSize: 18, color: 'text.primary' }} />
        ) : isError ? (
          <ErrorOutlineIcon sx={{ fontSize: 18, color: 'text.primary' }} />
        ) : (
          <AgentStatusIcon isActive={isConfigured} fontSize="small" />
        )}
      </Box>

      {/* Message content */}
      <Paper
        elevation={0}
        sx={{
          p: 1.75,
          maxWidth: { xs: '94%', sm: '88%', md: '82%' },
          borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : isError ? 'error.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          border: isUser || isError ? 'none' : '1px solid',
          borderColor: 'divider',
          minWidth: 140,
        }}
      >
        <Box
          sx={{
            '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
            '& strong': { fontWeight: 600 },
            lineHeight: 1.65,
            fontSize: '0.9rem',
          }}
        >
          {isUser ? <Typography variant="body2">{message.content}</Typography> : <FormattedMessage content={message.content} />}
        </Box>
        <Box
          sx={{
            mt: 0.5,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            gap: 0.5,
          }}
        >
          {isAssistant && (
            <Tooltip title={copiedMessageId === message.id ? 'Copied' : 'Copy response'}>
              <IconButton size="small" onClick={() => onCopy(message)} aria-label="Copy assistant response" sx={{ color: 'text.secondary', p: 0.25 }}>
                {copiedMessageId === message.id ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="caption">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

// Helper component to format AI responses
function FormattedMessage({ content }: { content: string }) {
  // Parse and format the message
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <Box key={i} sx={{ height: 8 }} />;
        }

        // Bold header (e.g., **Healthy:**)
        if (trimmed.startsWith('**') && trimmed.endsWith(':**')) {
          return (
            <Typography key={i} variant="subtitle2" sx={{ fontWeight: 600, mt: i > 0 ? 1 : 0, mb: 0.5 }}>
              {trimmed.replace(/\*\*/g, '').replace(/:$/, '')}
            </Typography>
          );
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const bulletContent = trimmed.replace(/^[•-]\s*/, '');
          return (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.25 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                •
              </Typography>
              <Typography variant="body2">
                <FormattedText text={bulletContent} />
              </Typography>
            </Box>
          );
        }

        // Regular paragraph
        return (
          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
            <FormattedText text={trimmed} />
          </Typography>
        );
      })}
    </>
  );
}

// Format inline text (bold, emojis preserved)
function FormattedText({ text }: { text: string }) {
  // Split by **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Box component="strong" key={i} sx={{ fontWeight: 600 }}>
              {part.slice(2, -2)}
            </Box>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function TypingIndicator({ isConfigured }: { isConfigured: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'primary.main',
        }}
      >
        <AgentStatusIcon isActive={isConfigured} fontSize="small" />
      </Box>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CircularProgress size={14} />
        <Typography variant="body2" color="text.secondary">
          Thinking...
        </Typography>
      </Paper>
    </Box>
  );
}

export default function AgentChatPanel() {
  const { isChatOpen, closeChat, messages, isLoading, sendMessage, clearHistory, openConfigModal } = useAgent();

  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isConfigured } = useAgent();

  // Track whether the user was near bottom BEFORE a new message is rendered.
  // We can't check this inside the effect because scrollHeight has already grown.
  const wasNearBottomRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= SCROLL_THRESHOLD_PX;
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    // showScrollToLatest will be set to false via the onScroll handler once the container scrolls.
  }, []);

  // Auto-scroll when messages change, based on position recorded before the render.
  useEffect(() => {
    if (wasNearBottomRef.current) {
      scrollToLatest();
    }
  }, [messages, isLoading, scrollToLatest]);

  // Focus input when panel opens
  useEffect(() => {
    if (isChatOpen) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [isChatOpen]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    wasNearBottomRef.current = nearBottom;
    setShowScrollToLatest(!nearBottom);
  }, [isNearBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    if (message.role !== 'assistant') return;
    if (!navigator.clipboard) return;

    await navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);

    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }

    copiedTimerRef.current = setTimeout(() => {
      setCopiedMessageId(null);
    }, 1600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isChatOpen}
      onClose={closeChat}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', sm: AGENT_CHAT_DRAWER_WIDTH },
            maxWidth: '100vw',
            height: `calc(100vh - ${APP_HEADER_HEIGHT}px)`,
            marginTop: APP_HEADER_HEIGHT_PX,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        },
        backdrop: { sx: { marginTop: APP_HEADER_HEIGHT_PX } },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <AgentStatusIcon isActive={isConfigured} fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary' }}>
              Lumiov AI
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.primary' }}>
              Cluster Assistant
            </Typography>
          </Box>
        </Box>

        <Box>
          <Tooltip title="Settings">
            <IconButton size="small" onClick={openConfigModal} sx={{ color: 'text.primary' }} aria-label="Open AI assistant settings">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear history">
            <IconButton size="small" onClick={clearHistory} sx={{ color: 'text.primary' }} aria-label="Clear chat history">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={closeChat} sx={{ color: 'text.primary' }} aria-label="Close AI assistant panel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={isLoading}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.6,
              textAlign: 'center',
              px: 3,
            }}
          >
            <AgentStatusIcon isActive={isConfigured} fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="body1" fontWeight={500} gutterBottom>
              Talk to your cluster
            </Typography>
            <Typography variant="body2" color="text.secondary" id={COMPOSER_HELPER_ID}>
              Ask questions like:
              <br />
              "How many pods are running?"
              <br />
              "Which deployments are unhealthy?"
              <br />
              "Describe the coredns pod"
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isConfigured={isConfigured} copiedMessageId={copiedMessageId} onCopy={handleCopyMessage} />
            ))}
            {isLoading && <TypingIndicator isConfigured={isConfigured} />}
            <div ref={messagesEndRef} />
          </>
        )}
        {showScrollToLatest && messages.length > 0 && (
          <Box sx={{ position: 'sticky', bottom: 8, alignSelf: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                scrollToLatest();
                setShowScrollToLatest(false);
              }}
              sx={{ borderRadius: 8 }}
            >
              Jump to latest
            </Button>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Ask Lumiov AI about your cluster..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          inputRef={inputRef}
          multiline
          maxRows={3}
          slotProps={{
            htmlInput: {
              'aria-label': 'Ask Lumiov AI about your cluster',
              'aria-describedby': COMPOSER_HELPER_ID,
            },
            input: {
              endAdornment: (
                <Tooltip title="Send message">
                  <span>
                    <IconButton
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      aria-label="Send message"
                      sx={{
                        bgcolor: input.trim() ? 'primary.main' : 'transparent',
                        color: input.trim() ? 'primary.contrastText' : 'text.secondary',
                        '&:hover': {
                          bgcolor: input.trim() ? 'primary.dark' : 'transparent',
                        },
                      }}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              pr: 0.5,
            },
          }}
        />
        <Typography id={COMPOSER_HELPER_ID} variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Enter to send, Shift+Enter for a new line.
        </Typography>
      </Box>
    </Drawer>
  );
}
