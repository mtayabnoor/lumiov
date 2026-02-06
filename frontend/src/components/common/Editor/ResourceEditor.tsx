import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WrapTextIcon from "@mui/icons-material/WrapText";
import MapIcon from "@mui/icons-material/Map";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

interface ResourceEditorProps {
  open: boolean;
  onClose: () => void;
  apiVersion: string;
  kind: string;
  namespace: string;
  name: string;
}

// VS Code Dark Theme Colors
const VSCODE_COLORS = {
  background: "#1e1e1e",
  sidebarBg: "#252526",
  headerBg: "#323233",
  border: "#3c3c3c",
  accent: "#0078d4",
  accentHover: "#1c8cd6",
  text: "#cccccc",
  textMuted: "#858585",
  textBright: "#ffffff",
  success: "#4ec9b0",
  warning: "#dcdcaa",
  error: "#f48771",
  info: "#9cdcfe",
};

const HEADER_HEIGHT = 50; // Match AppBar height

// Fields to hide when "Show Managed Fields" is OFF
const SYSTEM_FIELDS = [
  "managedFields",
  "creationTimestamp",
  "uid",
  "resourceVersion",
  "generation",
  "selfLink",
];

// Helper to strip system fields from object
const stripSystemFields = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;

  const clone = JSON.parse(JSON.stringify(obj));
  if (clone.metadata) {
    SYSTEM_FIELDS.forEach((field) => {
      delete clone.metadata[field];
    });
  }
  return clone;
};

function ResourceEditor({
  open,
  onClose,
  apiVersion,
  kind,
  namespace,
  name,
}: ResourceEditorProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Store full resource (including managed fields)
  const [fullResource, setFullResource] = useState<any>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editor options state
  const [wordWrap, setWordWrap] = useState<"on" | "off">("off");
  const [minimap, setMinimap] = useState(false);
  const [showManagedFields, setShowManagedFields] = useState(false); // OFF by default

  // Fetch resource when drawer opens
  useEffect(() => {
    if (open && namespace && name) {
      fetchResource();
    }
    // Reset state when closed
    if (!open) {
      setError(null);
      setSuccess(null);
      setFullResource(null);
      setContent("");
    }
  }, [open, namespace, name]);

  // When toggle changes, regenerate content from fullResource
  useEffect(() => {
    if (fullResource) {
      const objToShow = showManagedFields
        ? fullResource
        : stripSystemFields(fullResource);
      setContent(yaml.dump(objToShow, { indent: 2, lineWidth: -1 }));
    }
  }, [showManagedFields, fullResource]);

  const fetchResource = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `http://localhost:3030/api/resources/yaml?apiVersion=${encodeURIComponent(apiVersion)}&kind=${encodeURIComponent(kind)}&namespace=${encodeURIComponent(namespace)}&name=${encodeURIComponent(name)}`,
      );

      if (!res.ok) throw new Error("Failed to fetch resource");

      const responseText = await res.text();
      let rawData: any;

      // 1. Parse Response safely
      try {
        rawData = JSON.parse(responseText);
      } catch {
        rawData = responseText;
      }

      // 2. Ensure we have a valid JS Object for fullResource
      let objectToStore: any;

      if (typeof rawData === "string") {
        // Backend sent raw YAML string -> Parse it to Object
        objectToStore = yaml.load(rawData);
      } else {
        // Backend sent JSON object -> Use as is
        objectToStore = rawData;
      }

      // 3. Update State (ONLY ONCE)
      // We do NOT setContent here. We set fullResource, and let the
      // existing useEffect([showManagedFields, fullResource]) update the editor.
      setFullResource(objectToStore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiVersion, kind, namespace, name]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let parsed: any;
      try {
        parsed = yaml.load(content);
      } catch (e: any) {
        throw new Error(`Invalid YAML: ${e.message}`);
      }

      const res = await fetch(`http://localhost:3030/api/resources/yaml`, {
        method: "PUT",
        headers: { "Content-Type": "text/yaml" },
        body: content,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || "Failed to update");
      }

      setSuccess("Resource updated successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  // Dynamic styles based on theme
  const headerBg = isDark ? VSCODE_COLORS.headerBg : "#f3f3f3";
  const sidebarBg = isDark ? VSCODE_COLORS.sidebarBg : "#ffffff";
  const borderColor = isDark ? VSCODE_COLORS.border : "#e0e0e0";
  const textColor = isDark ? VSCODE_COLORS.text : "#333333";
  const textMuted = isDark ? VSCODE_COLORS.textMuted : "#666666";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", md: "55vw" },
          minWidth: { md: "700px" },
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          bgcolor: sidebarBg,
          marginTop: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          borderLeft: `1px solid ${borderColor}`,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            marginTop: `${HEADER_HEIGHT}px`,
          },
        },
      }}
    >
      {/* VS Code-like Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: headerBg,
          minHeight: 56,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                  fontWeight: 600,
                  color: textColor,
                  fontSize: "14px",
                }}
              >
                {name}
              </Typography>
              <Chip
                label={kind}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "11px",
                  fontWeight: 500,
                  bgcolor: isDark
                    ? "rgba(0, 120, 212, 0.2)"
                    : "rgba(0, 120, 212, 0.1)",
                  color: VSCODE_COLORS.accent,
                  border: `1px solid ${VSCODE_COLORS.accent}`,
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: textMuted,
                fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                fontSize: "11px",
              }}
            >
              {namespace} · {apiVersion}
            </Typography>
          </Box>
        </Box>

        {/* Toolbar Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip
            title={
              showManagedFields ? "Hide Managed Fields" : "Show Managed Fields"
            }
          >
            <IconButton
              size="small"
              onClick={() => {
                setShowManagedFields((v) => !v);
              }}
              sx={{
                color: showManagedFields ? VSCODE_COLORS.warning : textMuted,
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              {showManagedFields ? (
                <VisibilityIcon fontSize="small" />
              ) : (
                <VisibilityOffIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Word Wrap">
            <IconButton
              size="small"
              onClick={() => setWordWrap((w) => (w === "on" ? "off" : "on"))}
              sx={{
                color: wordWrap === "on" ? VSCODE_COLORS.accent : textMuted,
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <WrapTextIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Minimap">
            <IconButton
              size="small"
              onClick={() => setMinimap((m) => !m)}
              sx={{
                color: minimap ? VSCODE_COLORS.accent : textMuted,
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <MapIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Copy YAML">
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                color: textMuted,
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={fetchResource}
              disabled={loading}
              sx={{
                color: textMuted,
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              width: 1,
              height: 24,
              mx: 1,
              borderLeft: `1px solid ${borderColor}`,
            }}
          />

          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            size="small"
            disabled={loading || saving}
            onClick={handleSave}
            sx={{
              bgcolor: VSCODE_COLORS.accent,
              textTransform: "none",
              fontWeight: 500,
              px: 2,
              "&:hover": { bgcolor: VSCODE_COLORS.accentHover },
              "&:disabled": { bgcolor: isDark ? "#3a3a3a" : "#e0e0e0" },
            }}
          >
            {saving ? "Saving..." : "Apply"}
          </Button>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              ml: 1,
              color: textMuted,
              "&:hover": {
                bgcolor: "rgba(232, 17, 35, 0.2)",
                color: "#e81123",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      {(error || success) && (
        <Box sx={{ px: 2, py: 1, bgcolor: headerBg }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                py: 0,
                fontSize: "12px",
                bgcolor: isDark ? "rgba(244, 135, 113, 0.1)" : undefined,
                "& .MuiAlert-icon": { fontSize: 18 },
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess(null)}
              sx={{
                py: 0,
                fontSize: "12px",
                bgcolor: isDark ? "rgba(78, 201, 176, 0.1)" : undefined,
                "& .MuiAlert-icon": { fontSize: 18 },
              }}
            >
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Editor Content */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          bgcolor: isDark ? VSCODE_COLORS.background : "#ffffff",
        }}
      >
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              bgcolor: isDark ? VSCODE_COLORS.background : "#ffffff",
            }}
          >
            <CircularProgress size={32} sx={{ color: VSCODE_COLORS.accent }} />
          </Box>
        )}

        {!loading && (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={(val) => setContent(val || "")}
            theme={isDark ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: minimap },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
              lineNumbers: "on",
              wordWrap: wordWrap,
              renderWhitespace: "selection",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              folding: true,
              foldingHighlight: true,
              showFoldingControls: "mouseover",
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
            }}
          />
        )}
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          borderTop: `1px solid ${borderColor}`,
          bgcolor: isDark ? "#007acc" : "#0078d4",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 22,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#ffffff",
              fontSize: "11px",
              fontFamily: '"Segoe UI", sans-serif',
            }}
          >
            YAML
          </Typography>
          {!showManagedFields && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "11px",
                fontFamily: '"Segoe UI", sans-serif',
              }}
            >
              (Managed fields hidden)
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "#ffffff",
            fontSize: "11px",
            fontFamily: '"Segoe UI", sans-serif',
          }}
        >
          {content.split("\n").length} lines · UTF-8
        </Typography>
      </Box>
    </Drawer>
  );
}

export default ResourceEditor;
