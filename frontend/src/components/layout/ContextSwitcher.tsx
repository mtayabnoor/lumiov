import { useState } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  CircularProgress,
  Divider,
  alpha,
} from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CheckIcon from '@mui/icons-material/Check';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useContexts } from '../../hooks/useContexts';

export default function ContextSwitcher() {
  const { contexts, currentContext, loading, switching, switchContext } = useContexts();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (contextName: string) => {
    handleClose();
    if (contextName !== currentContext) {
      switchContext(contextName);
    }
  };

  // Don't render if no contexts loaded yet
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
      </Box>
    );
  }

  // Truncate long context names for the button display
  const displayName =
    currentContext.length > 28 ? `${currentContext.substring(0, 25)}…` : currentContext;

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        disabled={switching}
        sx={{
          ml: 2.5,
          px: 1.5,
          py: 0.5,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          transition: 'all 0.2s ease',
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.divider, 0.3),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.action.hover, 0.08),
            borderColor: 'primary.main',
          },
        }}
      >
        {switching ? (
          <CircularProgress size={14} sx={{ color: 'primary.main' }} />
        ) : (
          <CloudQueueIcon sx={{ fontSize: 16, color: 'primary.main', opacity: 0.9 }} />
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'text.primary',
            letterSpacing: '0.2px',
            userSelect: 'none',
          }}
        >
          {switching ? 'Switching…' : displayName}
        </Typography>
        <UnfoldMoreIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7 }} />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 260,
              maxWidth: 400,
              maxHeight: 360,
              borderRadius: '8px',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.5)'
                  : '0 8px 32px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'text.secondary',
            }}
          >
            Kubernetes Context
          </Typography>
        </Box>
        <Divider />
        {contexts.map((ctx) => {
          const isActive = ctx.name === currentContext;
          return (
            <MenuItem
              key={ctx.name}
              selected={isActive}
              onClick={() => handleSelect(ctx.name)}
              sx={{
                py: 1,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {isActive ? (
                  <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                ) : (
                  <Box sx={{ width: 16 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={ctx.name}
                secondary={ctx.cluster}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: isActive ? 600 : 400,
                  sx: {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: {
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
