import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Switch,
  Divider,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useSettings } from '../../context/SettingsContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { deleteEnabled, setDeleteEnabled } = useSettings();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsRoundedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Settings
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, pb: 3 }}>
        {/* ─── Danger Zone ─────────────────────────────────────── */}
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mb: 1.5,
          }}
        >
          <DeleteForeverRoundedIcon sx={{ fontSize: 14 }} />
          Danger Zone
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: (theme) =>
              deleteEnabled
                ? alpha(theme.palette.error.main, 0.4)
                : alpha(theme.palette.divider, 0.3),
            bgcolor: (theme) =>
              deleteEnabled ? alpha(theme.palette.error.main, 0.04) : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
              Enable Delete Actions
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', lineHeight: 1.3 }}
            >
              Allow deleting resources from context menus.
              {deleteEnabled ? ' Active — be careful.' : ' Currently disabled.'}
            </Typography>
          </Box>
          <Switch
            checked={deleteEnabled}
            onChange={(e) => setDeleteEnabled(e.target.checked)}
            color="error"
            size="small"
          />
        </Box>

        {/* Future settings sections */}
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontStyle: 'italic' }}
          >
            More settings coming soon.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
