/**
 * Agent Chat Panel
 *
 * Sliding drawer panel for chatting with the AI cluster assistant.
 */

import { useState, useRef, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import PsychologyIcon from "@mui/icons-material/Psychology";
import PersonIcon from "@mui/icons-material/Person";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useAgent, ChatMessage } from "../../context/AgentContext";

const DRAWER_WIDTH = 420;

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const { isConfigured } = useAgent();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 1.5,
        mb: 2,
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isUser
            ? "primary.main"
            : isError
              ? "error.main"
              : "primary.main",
        }}
      >
        {isUser ? (
          <PersonIcon sx={{ fontSize: 18, color: "#fff" }} />
        ) : isError ? (
          <ErrorOutlineIcon sx={{ fontSize: 18, color: "#fff" }} />
        ) : (
          <PsychologyIcon
            fontSize="medium"
            sx={{
              color: isConfigured ? "primary.main" : "#fff",
              filter: isConfigured
                ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                : "none",
              transition: "all 0.3s ease",
            }}
          />
        )}
      </Box>

      {/* Message content */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          maxWidth: "85%",
          borderRadius: 2,
          bgcolor: isUser
            ? "primary.main"
            : isError
              ? "error.light"
              : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          border: isUser || isError ? "none" : "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            "& p": { m: 0, mb: 1, "&:last-child": { mb: 0 } },
            "& strong": { fontWeight: 600 },
            lineHeight: 1.6,
            fontSize: "0.875rem",
          }}
        >
          {isUser ? (
            <Typography variant="body2">{message.content}</Typography>
          ) : (
            <FormattedMessage content={message.content} />
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            opacity: 0.7,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Paper>
    </Box>
  );
}

// Helper component to format AI responses
function FormattedMessage({ content }: { content: string }) {
  // Parse and format the message
  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <Box key={i} sx={{ height: 8 }} />;
        }

        // Bold header (e.g., **Healthy:**)
        if (trimmed.startsWith("**") && trimmed.endsWith(":**")) {
          return (
            <Typography
              key={i}
              variant="subtitle2"
              sx={{ fontWeight: 600, mt: i > 0 ? 1 : 0, mb: 0.5 }}
            >
              {trimmed.replace(/\*\*/g, "").replace(/:$/, "")}
            </Typography>
          );
        }

        // Bullet point
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const bulletContent = trimmed.replace(/^[•\-]\s*/, "");
          return (
            <Box key={i} sx={{ display: "flex", gap: 1, mb: 0.25 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
        if (part.startsWith("**") && part.endsWith("**")) {
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

function TypingIndicator() {
  const { isConfigured } = useAgent();
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "primary.main",
        }}
      >
        <PsychologyIcon
          fontSize="medium"
          sx={{
            color: isConfigured ? "primary.main" : "#fff",
            filter: isConfigured
              ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
              : "none",
            transition: "all 0.3s ease",
          }}
        />
      </Box>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
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
  const {
    isChatOpen,
    closeChat,
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    openConfigModal,
  } = useAgent();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isConfigured } = useAgent();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isChatOpen}
      onClose={closeChat}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 2, // Above AppBar
      }}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          maxWidth: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          borderLeft: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          minHeight: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "primary.background",
          color: "primary.contrastText",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box>
            <PsychologyIcon
              fontSize="medium"
              sx={{
                color: isConfigured ? "primary.main" : "#fff",
                filter: isConfigured
                  ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ color: "#fff" }}
            >
              Lumiov AI
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Cluster Assistant
            </Typography>
          </Box>
        </Box>

        <Box>
          <Tooltip title="Settings">
            <IconButton
              size="small"
              onClick={openConfigModal}
              sx={{ color: "#fff" }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear history">
            <IconButton
              size="small"
              onClick={clearHistory}
              sx={{ color: "#fff" }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={closeChat} sx={{ color: "#fff" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 0.6,
              textAlign: "center",
              px: 3,
            }}
          >
            <PsychologyIcon
              fontSize="medium"
              sx={{
                color: isConfigured ? "primary.main" : "#fff",
                filter: isConfigured
                  ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            />
            <Typography variant="body1" fontWeight={500} gutterBottom>
              Talk to your cluster
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Ask about your cluster..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          inputRef={inputRef}
          multiline
          maxRows={3}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  sx={{
                    bgcolor: input.trim() ? "primary.main" : "transparent",
                    color: input.trim()
                      ? "primary.contrastText"
                      : "text.secondary",
                    "&:hover": {
                      bgcolor: input.trim() ? "primary.dark" : "transparent",
                    },
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              pr: 0.5,
            },
          }}
        />
      </Box>
    </Drawer>
  );
}
