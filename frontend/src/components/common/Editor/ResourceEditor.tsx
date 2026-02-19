import React, { useEffect, useState } from 'react';
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
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WrapTextIcon from '@mui/icons-material/WrapText';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';

interface ResourceEditorProps {
  open: boolean;
  onClose: () => void;
  apiVersion: string;
  kind: string;
  namespace: string;
  name: string;
}

const HEADER_HEIGHT = 50; // Match AppBar height

// 1. Metadata Fields (System Managed) - Hide these from metadata
// 1. Metadata Fields (System Managed) - Hide these from metadata
const SYSTEM_METADATA_FIELDS = [
  'managedFields', // Noise
  'resourceVersion', // Optimistic locking
  'generation', // Update ID
  'uid', // Immutable ID
  'creationTimestamp', // Immutable
  'deletionTimestamp', // Lifecycle
  'deletionGracePeriodSeconds',
  'selfLink', // Deprecated
  'generateName', // Lifecycle
  'ownerReferences', // Relationship
  'finalizers', // Lifecycle (Moved here from Spec list as it lives in metadata)
];

// 2. Spec Fields (System Assigned / Defaults) - Hide these from Spec
const SYSTEM_SPEC_FIELDS = [
  'nodeName', // Assigned by Scheduler
  'clusterIP', // Assigned by K8s
  'clusterIPs', // Assigned by K8s
  'serviceAccount', // Deprecated (serviceAccountName is used instead)
  'priority', // Calculated from priorityClassName
];

const stripSystemFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  // 1. Deep clone to avoid mutating the original data
  const clone = JSON.parse(JSON.stringify(obj));

  // ---------------------------------------------------------
  // A. REMOVE ROOT-LEVEL STATE
  // ---------------------------------------------------------
  delete clone.status;

  // ---------------------------------------------------------
  // B. REMOVE METADATA NOISE (Dynamic Loop)
  // ---------------------------------------------------------
  if (clone.metadata) {
    // Loop through the list and delete each field
    SYSTEM_METADATA_FIELDS.forEach((field) => delete clone.metadata[field]);

    // Handle the specific "Last Applied" annotation separately
    if (clone.metadata.annotations) {
      delete clone.metadata.annotations[
        'kubectl.kubernetes.io/last-applied-configuration'
      ];

      // Cleanup empty annotations object
      if (Object.keys(clone.metadata.annotations).length === 0) {
        delete clone.metadata.annotations;
      }
    }
  }

  // ---------------------------------------------------------
  // C. REMOVE SPEC NOISE (Dynamic Loop)
  // ---------------------------------------------------------
  if (clone.spec) {
    // Loop through the list and delete each field
    SYSTEM_SPEC_FIELDS.forEach((field) => delete clone.spec[field]);
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
  const isDark = theme.palette.mode === 'dark';

  // State
  const [fullResource, setFullResource] = useState<any>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editor options
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('off');
  const [minimap, setMinimap] = useState(false);
  const [showManagedFields, setShowManagedFields] = useState(false);

  // Reset state when closed
  useEffect(() => {
    if (open && namespace && name) {
      fetchResource();
    }
    if (!open) {
      setError(null);
      setSuccess(null);
      setFullResource(null);
      setContent('');
    }
  }, [open, namespace, name]);

  // Regenerate content when toggle or fullResource changes
  useEffect(() => {
    if (fullResource) {
      const objToShow = showManagedFields
        ? fullResource
        : stripSystemFields(fullResource);
      setContent(yaml.dump(objToShow, { indent: 2, lineWidth: -1 }));
    }
  }, [showManagedFields, fullResource]);

  const fetchResource = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `http://localhost:3030/api/resource/yaml?apiVersion=${encodeURIComponent(apiVersion)}&kind=${encodeURIComponent(kind)}&namespace=${encodeURIComponent(namespace)}&name=${encodeURIComponent(name)}`,
      );

      if (!res.ok) throw new Error('Failed to fetch resource');

      const responseText = await res.text();
      let rawData: any;

      try {
        rawData = JSON.parse(responseText);
      } catch {
        rawData = responseText;
      }

      const objectToStore = typeof rawData === 'string' ? yaml.load(rawData) : rawData;
      setFullResource(objectToStore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      try {
        yaml.load(content); // Validate YAML
      } catch (e: any) {
        throw new Error(`Invalid YAML: ${e.message}`);
      }

      const res = await fetch(`http://localhost:3030/api/resource/yaml`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/yaml' },
        body: content,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || 'Failed to update');
      }

      setSuccess('Resource updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Toolbar icon button style helper
  const iconButtonSx = (active: boolean = false) => ({
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) },
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100vw', md: '55vw' },
            minWidth: { md: '700px' },
            maxWidth: '1000px',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            marginTop: `${HEADER_HEIGHT}px`,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            borderLeft: 1,
            borderColor: 'divider',
          },
        },
        backdrop: { sx: { marginTop: `${HEADER_HEIGHT}px` } },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {name}
            </Typography>
            <Chip
              label={kind}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '11px' }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontFamily: 'monospace' }}
          >
            {namespace} · {apiVersion}
          </Typography>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip
            title={showManagedFields ? 'Hide Managed Fields' : 'Show Managed Fields'}
          >
            <IconButton
              size="small"
              onClick={() => setShowManagedFields((v) => !v)}
              sx={iconButtonSx(showManagedFields)}
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
              onClick={() => setWordWrap((w) => (w === 'on' ? 'off' : 'on'))}
              sx={iconButtonSx(wordWrap === 'on')}
            >
              <WrapTextIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Minimap">
            <IconButton
              size="small"
              onClick={() => setMinimap((m) => !m)}
              sx={iconButtonSx(minimap)}
            >
              <MapIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Copy YAML">
            <IconButton size="small" onClick={handleCopy} sx={iconButtonSx()}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={fetchResource}
              disabled={loading}
              sx={iconButtonSx()}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              width: 1,
              height: 24,
              mx: 1,
              borderLeft: 1,
              borderColor: 'divider',
            }}
          />

          <Button
            startIcon={<SaveIcon />}
            variant="contained"
            size="small"
            disabled={loading || saving}
            onClick={handleSave}
            sx={{ textTransform: 'none', fontWeight: 500, px: 2 }}
          >
            {saving ? 'Saving...' : 'Apply'}
          </Button>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              ml: 1,
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha('#e81123', 0.2), color: '#e81123' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Alerts */}
      {(error || success) && (
        <Box sx={{ px: 2, py: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ py: 0 }}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Editor */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={(val) => setContent(val || '')}
            theme={isDark ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: minimap },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: '"Consolas", "Monaco", monospace',
              lineNumbers: 'on',
              wordWrap,
              renderWhitespace: 'selection',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              folding: true,
              showFoldingControls: 'mouseover',
              bracketPairColorization: { enabled: true },
              guides: { indentation: true, bracketPairs: true },
            }}
          />
        )}
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 22,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: 'primary.contrastText', fontSize: '11px' }}
          >
            YAML
          </Typography>
          {!showManagedFields && (
            <Typography
              variant="caption"
              sx={{ color: alpha('#fff', 0.7), fontSize: '11px' }}
            >
              (Managed fields hidden)
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'primary.contrastText', fontSize: '11px' }}
        >
          {content.split('\n').length} lines · UTF-8
        </Typography>
      </Box>
    </Drawer>
  );
}

export default ResourceEditor;
