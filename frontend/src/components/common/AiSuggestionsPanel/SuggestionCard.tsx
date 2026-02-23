/**
 * SuggestionCard Component
 *
 * Individual card for a single AI suggestion showing type badge,
 * severity indicator, description, inline diff, and accept/reject buttons.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SpeedIcon from '@mui/icons-material/Speed';
import type {
  YamlSuggestion,
  SuggestionType,
  SuggestionSeverity,
} from '../../../interfaces/yaml-analysis';
import DiffViewer from './DiffViewer';

interface SuggestionCardProps {
  suggestion: YamlSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const TYPE_CONFIG: Record<
  SuggestionType,
  { icon: React.ReactElement; label: string; color: string }
> = {
  syntax: { icon: <CodeIcon sx={{ fontSize: 14 }} />, label: 'Syntax', color: '#e040fb' },
  security: {
    icon: <SecurityIcon sx={{ fontSize: 14 }} />,
    label: 'Security',
    color: '#ff5252',
  },
  'best-practice': {
    icon: <TipsAndUpdatesIcon sx={{ fontSize: 14 }} />,
    label: 'Best Practice',
    color: '#448aff',
  },
  optimization: {
    icon: <SpeedIcon sx={{ fontSize: 14 }} />,
    label: 'Optimization',
    color: '#69f0ae',
  },
};

const SEVERITY_CONFIG: Record<
  SuggestionSeverity,
  { color: 'error' | 'warning' | 'info'; label: string }
> = {
  critical: { color: 'error', label: 'Critical' },
  warning: { color: 'warning', label: 'Warning' },
  info: { color: 'info', label: 'Info' },
};

function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const typeConfig = TYPE_CONFIG[suggestion.type];
  const severityConfig = SEVERITY_CONFIG[suggestion.severity];

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: alpha(typeConfig.color, 0.5),
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          bgcolor: alpha(typeConfig.color, 0.06),
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Type badge */}
        <Chip
          icon={typeConfig.icon}
          label={typeConfig.label}
          size="small"
          sx={{
            height: 22,
            fontSize: '10px',
            fontWeight: 600,
            bgcolor: alpha(typeConfig.color, 0.15),
            color: typeConfig.color,
            '& .MuiChip-icon': { color: typeConfig.color },
          }}
        />

        {/* Severity */}
        <Chip
          label={severityConfig.label}
          size="small"
          color={severityConfig.color}
          variant="outlined"
          sx={{ height: 20, fontSize: '10px' }}
        />

        {/* Line indicator */}
        <Typography
          variant="caption"
          sx={{
            fontSize: '10px',
            color: 'text.disabled',
            fontFamily: 'monospace',
          }}
        >
          L{suggestion.lineStart}
          {suggestion.lineEnd !== suggestion.lineStart && `–${suggestion.lineEnd}`}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Accept / Reject */}
        <Tooltip title="Accept change">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(suggestion.id);
            }}
            sx={{
              p: 0.4,
              color: 'success.main',
              '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.15) },
            }}
          >
            <CheckIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Reject">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onReject(suggestion.id);
            }}
            sx={{
              p: 0.4,
              color: 'text.disabled',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.15),
                color: 'error.main',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            color: 'text.disabled',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </Box>

      {/* Expandable body */}
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, py: 1 }}>
          {/* Title */}
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: '12px', mb: 0.5, color: 'text.primary' }}
          >
            {suggestion.title}
          </Typography>

          {/* Description */}
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mb: 1, lineHeight: 1.5 }}
          >
            {suggestion.description}
          </Typography>

          {/* Diff */}
          <DiffViewer
            originalCode={suggestion.originalCode}
            suggestedCode={suggestion.suggestedCode}
          />

          {/* Rationale */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: 'text.disabled',
              fontStyle: 'italic',
              fontSize: '11px',
            }}
          >
            💡 {suggestion.rationale}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export default SuggestionCard;
