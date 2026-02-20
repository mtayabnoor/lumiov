/**
 * AiSuggestionsPanel Component
 *
 * Side panel that renders within the ResourceEditor drawer.
 * Shows AI analysis results grouped by type, with controls
 * for accepting/rejecting all suggestions.
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import type { YamlSuggestion } from '../../../../interfaces/yaml-analysis';
import SuggestionCard from './SuggestionCard';

interface AiSuggestionsPanelProps {
  suggestions: YamlSuggestion[];
  overallScore: number | null;
  summary: string | null;
  loading: boolean;
  error: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}

/** Maps score ranges to a color + label */
function getScoreInfo(score: number): { color: string; label: string } {
  if (score >= 80) return { color: '#4caf50', label: 'Excellent' };
  if (score >= 60) return { color: '#ff9800', label: 'Fair' };
  if (score >= 40) return { color: '#ff5722', label: 'Needs Work' };
  return { color: '#f44336', label: 'Critical' };
}

function AiSuggestionsPanel({
  suggestions,
  overallScore,
  summary,
  loading,
  error,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onClose,
}: AiSuggestionsPanelProps) {
  const theme = useTheme();

  const criticalCount = suggestions.filter((s) => s.severity === 'critical').length;
  const warningCount = suggestions.filter((s) => s.severity === 'warning').length;
  const infoCount = suggestions.filter((s) => s.severity === 'info').length;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: '13px', fontWeight: 700, color: 'text.primary' }}
          >
            ✨ AI Analysis
          </Typography>
          {suggestions.length > 0 && (
            <Chip
              label={`${suggestions.length}`}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '11px', fontWeight: 600 }}
            />
          )}
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
          }}
        >
          <CircularProgress size={36} thickness={3} />
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center' }}
          >
            Analyzing your YAML manifest...
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', textAlign: 'center' }}
          >
            Checking syntax, security, best practices & optimizations
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box sx={{ p: 1.5 }}>
          <Alert severity="error" sx={{ fontSize: '12px' }}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Results */}
      {!loading && !error && overallScore !== null && (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Score Bar */}
          <Box sx={{ px: 1.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Quality Score
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: getScoreInfo(overallScore).color,
                  fontSize: '13px',
                }}
              >
                {overallScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallScore}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(getScoreInfo(overallScore).color, 0.15),
                '& .MuiLinearProgress-bar': {
                  bgcolor: getScoreInfo(overallScore).color,
                  borderRadius: 3,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.75,
                fontSize: '11px',
              }}
            >
              {summary}
            </Typography>

            {/* Severity counts */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {criticalCount > 0 && (
                <Chip
                  label={`${criticalCount} Critical`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '10px' }}
                />
              )}
              {warningCount > 0 && (
                <Chip
                  label={`${warningCount} Warning`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '10px' }}
                />
              )}
              {infoCount > 0 && (
                <Chip
                  label={`${infoCount} Info`}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '10px' }}
                />
              )}
            </Box>
          </Box>

          {/* Batch Actions */}
          {suggestions.length > 0 && (
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                display: 'flex',
                gap: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={onAcceptAll}
                sx={{
                  textTransform: 'none',
                  fontSize: '11px',
                  color: 'success.main',
                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) },
                }}
              >
                Accept All
              </Button>
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={onRejectAll}
                sx={{
                  textTransform: 'none',
                  fontSize: '11px',
                  color: 'text.disabled',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: 'error.main',
                  },
                }}
              >
                Dismiss All
              </Button>
            </Box>
          )}

          {/* Suggestion Cards */}
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {suggestions.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 4,
                  gap: 1,
                }}
              >
                <CheckIcon sx={{ fontSize: 36, color: 'success.main' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                >
                  All suggestions reviewed!
                </Typography>
              </Box>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={onAccept}
                  onReject={onReject}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Empty initial state */}
      {!loading && !error && overallScore === null && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center' }}
          >
            Click "✨ Analyze" to start AI analysis
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AiSuggestionsPanel;
