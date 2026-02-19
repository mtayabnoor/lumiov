import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string; // e.g., "my-pod-123"
  resourceKind: string; // e.g., "Pod"
  isDeleting?: boolean; // To show loading state on the button
}

function ResourceDeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  resourceName,
  resourceKind,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            padding: 1,
            minWidth: '400px',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberRoundedIcon color="error" />
        Confirm Deletion
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the <strong>{resourceKind}</strong> named{' '}
          <Typography component="span" fontWeight="bold" color="error.main">
            {resourceName}
          </Typography>
          ?
        </DialogContentText>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontSize: '0.875rem',
            color: 'text.secondary',
          }}
        >
          This action cannot be undone. The resource will be permanently removed from the
          cluster.
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          variant="contained"
          color="error"
          autoFocus
        >
          {isDeleting ? 'Deleting...' : 'Delete Resource'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ResourceDeleteConfirmDialog;
