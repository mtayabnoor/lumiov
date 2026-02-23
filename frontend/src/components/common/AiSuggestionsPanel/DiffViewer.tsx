/**
 * DiffViewer Component
 *
 * Renders an inline diff showing old (red) vs new (green) lines.
 * Used inside SuggestionCard to visualize proposed changes.
 */

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

interface DiffViewerProps {
  originalCode: string;
  suggestedCode: string;
}

function DiffViewer({ originalCode, suggestedCode }: DiffViewerProps) {
  const theme = useTheme();

  const oldLines = originalCode.split('\n');
  const newLines = suggestedCode.split('\n');

  const deletionBg = alpha(theme.palette.error.main, 0.12);
  const deletionBorder = alpha(theme.palette.error.main, 0.3);
  const additionBg = alpha(theme.palette.success.main, 0.12);
  const additionBorder = alpha(theme.palette.success.main, 0.3);

  const lineStyle = {
    fontFamily: '"Consolas", "Monaco", monospace',
    fontSize: '12px',
    lineHeight: '20px',
    px: 1.5,
    py: 0.25,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    whiteSpace: 'pre' as const,
    overflow: 'hidden',
  };

  return (
    <Box
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Removed lines */}
      {oldLines.map((line, i) => (
        <Box
          key={`old-${i}`}
          sx={{
            ...lineStyle,
            bgcolor: deletionBg,
            borderLeft: `3px solid ${deletionBorder}`,
          }}
        >
          <RemoveIcon sx={{ fontSize: 14, color: 'error.main', flexShrink: 0 }} />
          <Typography
            component="span"
            sx={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              color: 'error.main',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line || ' '}
          </Typography>
        </Box>
      ))}

      {/* Added lines */}
      {newLines.map((line, i) => (
        <Box
          key={`new-${i}`}
          sx={{
            ...lineStyle,
            bgcolor: additionBg,
            borderLeft: `3px solid ${additionBorder}`,
          }}
        >
          <AddIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />
          <Typography
            component="span"
            sx={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              color: 'success.main',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line || ' '}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default DiffViewer;
