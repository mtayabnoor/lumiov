/**
 * Agent Config Modal
 *
 * Modal dialog for configuring the OpenAI API key.
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Divider,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PsychologyIcon from "@mui/icons-material/Psychology";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAgent } from "../../context/AgentContext";

export default function AgentConfigModal() {
  const {
    isConfigModalOpen,
    closeConfigModal,
    configureAgent,
    isConfiguring,
    configError,
    isConfigured,
    resetConfiguration,
  } = useAgent();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setLocalError("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      setLocalError("API key should start with 'sk-'");
      return;
    }

    setLocalError(null);
    const result = await configureAgent(apiKey);

    if (result.success) {
      setApiKey(""); // Clear the field on success
    }
  };

  const handleClose = () => {
    setApiKey("");
    setLocalError(null);
    closeConfigModal();
  };

  const handleDisconnect = () => {
    resetConfiguration();
    setApiKey("");
    setLocalError(null);
  };

  const error = localError || configError;

  return (
    <Dialog
      open={isConfigModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PsychologyIcon
            fontSize="medium"
            sx={{
              color: isConfigured ? "#e02222ff" : "#fff",
              filter: isConfigured
                ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                : "none",
              transition: "all 0.3s ease",
            }}
          />
          <Typography variant="h6" fontWeight={600}>
            {isConfigured ? "AI Assistant Settings" : "Configure AI Assistant"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isConfigured ? (
          // Already configured - show disconnect option
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              AI Assistant is connected and ready to use.
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your OpenAI API key is stored locally. You can disconnect at any
              time to remove your API key from this device.
            </Typography>

            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Disconnect API Key
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This will remove your API key and clear chat history
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Update API Key
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your OpenAI API key to enable the AI cluster assistant. Your
            key is stored locally and never sent to our servers.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="OpenAI API Key"
          placeholder="sk-..."
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isConfiguring}
          autoFocus={!isConfigured}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowKey(!showKey)}
                    edge="end"
                    size="small"
                  >
                    {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isConfiguring) {
              handleSubmit();
            }
          }}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, display: "block" }}
        >
          Don't have an API key?{" "}
          <Link
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener"
          >
            Get one from OpenAI
          </Link>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isConfiguring}>
          {isConfigured ? "Close" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isConfiguring || !apiKey.trim()}
        >
          {isConfiguring ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />
              Validating...
            </>
          ) : isConfigured ? (
            "Update Key"
          ) : (
            "Connect"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
