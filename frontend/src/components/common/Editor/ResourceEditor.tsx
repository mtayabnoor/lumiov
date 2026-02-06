import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
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

const ResourceEditor: React.FC<ResourceEditorProps> = ({
  open,
  onClose,
  apiVersion,
  kind,
  namespace,
  name,
}) => {
  const theme = useTheme();
  const [content, setContent] = useState<string>("");
  const [originalJson, setOriginalJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch resource when drawer opens
  useEffect(() => {
    if (open && namespace && name) {
      fetchResource();
    }
  }, [open, namespace, name]);

  const fetchResource = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3030/api/resources/yaml?apiVersion=${apiVersion}&kind=${kind}&namespace=${namespace}&name=${name}`,
      );

      if (!res.ok) throw new Error("Failed to fetch resource");

      // 1. Get the response
      // If your backend sends 'text/yaml', res.json() might fail or act weird.
      // It's safer to get text first, then try to parse if needed.
      const responseText = await res.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If it fails to parse as JSON, it's likely raw YAML text already.
        data = responseText;
      }

      // 2. Logic to prevent "Double Dumping"
      if (typeof data === "string") {
        // CASE A: Backend sent a String (YAML)
        // We use it directly. We also load it to an object just to setOriginalJson
        setContent(data);
        try {
          setOriginalJson(yaml.load(data));
        } catch (e) {
          /* ignore */
        }
      } else {
        // CASE B: Backend sent a JSON Object
        // We convert it to YAML
        setOriginalJson(data);
        setContent(yaml.dump(data));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Parse YAML back to JSON
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

      // Success
      onClose(); // Close on success
      // Ideally we'd show a snackbar here, but for now closing is fine.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "50vw",
          minWidth: "600px",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        <Box>
          <Typography variant="h6">
            Edit {kind.slice(0, -1)}: {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Namespace: {namespace}
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            disabled={loading || saving}
            onClick={handleSave}
            sx={{ mr: 1 }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={(val) => setContent(val || "")}
            theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
            }}
          />
        )}
      </Box>

      {/* Footer / Error Area */}
      {error && (
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}
    </Drawer>
  );
};

export default ResourceEditor;
