/**
 * CreateManifestDialog
 *
 * Full-screen dialog for creating new Kubernetes manifests.
 * Features a Monaco YAML editor with template selection,
 * AI analysis, and "Apply to Cluster" functionality.
 */

import { API_BASE } from '../../../config/api';
import { useState, useCallback } from 'react';
import { Dialog, Box, Typography, IconButton, Button, Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress, Tooltip, Chip, alpha } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Editor from '@monaco-editor/react';
import AiSuggestionsPanel from '../AiSuggestionsPanel/AiSuggestionsPanel';
import { useYamlAnalysis } from '../../../hooks/useYamlAnalysis';
import { useTheme } from '@mui/material/styles';
import { useAgent } from '../../../context/AgentContext';

// ─── Templates ─────────────────────────────────────────────────

const TEMPLATES: Record<string, { label: string; yaml: string }> = {
  deployment: {
    label: 'Deployment',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 250m
              memory: 256Mi
`,
  },
  service: {
    label: 'Service',
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: default
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
`,
  },
  configmap: {
    label: 'ConfigMap',
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
  namespace: default
data:
  key1: value1
  key2: value2
  config.yaml: |
    setting: true
    debug: false
`,
  },
  secret: {
    label: 'Secret',
    yaml: `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
  namespace: default
type: Opaque
stringData:
  username: admin
  password: changeme
`,
  },
  ingress: {
    label: 'Ingress',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
`,
  },
  cronjob: {
    label: 'CronJob',
    yaml: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-cronjob
  namespace: default
spec:
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: job
              image: busybox:1.36
              command: ["echo", "Hello from CronJob"]
          restartPolicy: OnFailure
`,
  },
  namespace: {
    label: 'Namespace',
    yaml: `apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
  labels:
    team: my-team
`,
  },
  blank: {
    label: 'Blank',
    yaml: `apiVersion: v1
kind: 
metadata:
  name: 
  namespace: default
`,
  },
};

// ─── Component ─────────────────────────────────────────────────

interface CreateManifestDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateManifestDialog({ open, onClose }: CreateManifestDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [template, setTemplate] = useState('blank');
  const { isConfigured } = useAgent();
  const [content, setContent] = useState(TEMPLATES.blank.yaml);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // AI Analysis
  const [showAiPanel, setShowAiPanel] = useState(false);
  const analysis = useYamlAnalysis();

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    setContent(TEMPLATES[value]?.yaml || '');
    setError(null);
    setSuccess(null);
    analysis.reset();
    setShowAiPanel(false);
  };

  const handleApply = async () => {
    if (!content.trim()) {
      setError('Editor is empty. Write or select a template first.');
      return;
    }

    setApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/api/resource/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/yaml' },
        body: content,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      setSuccess('Resource applied successfully! 🎉');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setContent(TEMPLATES.deployment.yaml);
        setTemplate('deployment');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to apply resource');
    } finally {
      setApplying(false);
    }
  };

  const handleAnalyze = useCallback(() => {
    if (!content.trim()) {
      setError('Editor is empty. Nothing to analyze.');
      return;
    }
    setShowAiPanel(true);
    analysis.analyzeYaml(content);
  }, [content, analysis]);

  const handleAcceptSuggestion = useCallback(
    (id: string) => {
      const accepted = analysis.acceptSuggestion(id);
      if (accepted) {
        setContent((prev) => prev.replace(accepted.originalCode, accepted.suggestedCode));
      }
    },
    [analysis],
  );

  const handleAcceptAll = useCallback(() => {
    const all = analysis.acceptAll();
    const sorted = [...all].sort((a, b) => b.lineStart - a.lineStart);
    setContent((prev) => {
      let result = prev;
      for (const s of sorted) {
        result = result.replace(s.originalCode, s.suggestedCode);
      }
      return result;
    });
  }, [analysis]);

  const handleCloseAiPanel = useCallback(() => {
    setShowAiPanel(false);
    analysis.reset();
  }, [analysis]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleClose = () => {
    onClose();
    setError(null);
    setSuccess(null);
    analysis.reset();
    setShowAiPanel(false);
    setContent(TEMPLATES.deployment.yaml);
    setTemplate('deployment');
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={showAiPanel ? 'xl' : 'md'}
      slotProps={{
        paper: {
          sx: {
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            transition: 'max-width 0.3s ease',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h3">Create / Apply</Typography>

          {/* Template Selector */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: '14px' }}>Template</InputLabel>
            <Select value={template} label="Template" onChange={(e) => handleTemplateChange(e.target.value)} sx={{ fontSize: '16px', height: 34 }}>
              {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                <MenuItem key={key} value={key} sx={{ fontSize: '13px' }}>
                  {tmpl.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* AI Analyze Button */}
          <Tooltip title="AI Analysis">
            <IconButton size="small" onClick={handleAnalyze}>
              <SmartToyIcon
                sx={{
                  color: isConfigured ? '#b42323ff' : 'text.primary',
                  filter: isConfigured ? 'drop-shadow(0 0 0.8px text.primary) drop-shadow(0 0 1px text.primary)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Copy YAML">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: 1, height: 24, mx: 1, borderLeft: 1, borderColor: 'divider' }} />

          {/* Apply Button */}
          <Button
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : ''}
            variant="contained"
            size="small"
            disabled={applying}
            onClick={handleApply}
            sx={{
              width: 150,
            }}
          >
            {applying ? 'Applying...' : 'Apply'}
          </Button>

          <IconButton
            onClick={handleClose}
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
            <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0, fontSize: '13px' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ py: 0, fontSize: '13px' }}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Editor + AI Panel */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Monaco Editor */}
        <Box
          sx={{
            flex: showAiPanel ? '0 0 60%' : '1 1 100%',
            overflow: 'hidden',
            bgcolor: 'background.default',
            transition: 'flex 0.3s ease',
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={content}
            onChange={(val) => setContent(val || '')}
            theme={isDark ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: '"Consolas", "Monaco", monospace',
              lineNumbers: 'on',
              wordWrap: 'off',
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
        </Box>

        {/* AI Suggestions Panel */}
        {showAiPanel && (
          <Box sx={{ flex: '0 0 40%', minWidth: 300 }}>
            <AiSuggestionsPanel
              suggestions={analysis.suggestions}
              overallScore={analysis.overallScore}
              summary={analysis.summary}
              loading={analysis.loading}
              error={analysis.error}
              onAccept={handleAcceptSuggestion}
              onReject={analysis.rejectSuggestion}
              onAcceptAll={handleAcceptAll}
              onRejectAll={analysis.rejectAll}
              onClose={handleCloseAiPanel}
            />
          </Box>
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
          <Typography variant="caption" sx={{ color: 'white', fontSize: '11px' }}>
            YAML · New Manifest
          </Typography>
          <Chip
            label={TEMPLATES[template]?.label || template}
            size="small"
            sx={{
              height: 18,
              fontSize: '10px',
              color: 'white',
              bgcolor: alpha('#fff', 0.15),
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'white', fontSize: '11px' }}>
          {content.split('\n').length} lines · UTF-8
        </Typography>
      </Box>
    </Dialog>
  );
}

export default CreateManifestDialog;
