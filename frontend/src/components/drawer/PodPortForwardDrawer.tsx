import { useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import type { AppErrorPayload, PortForwardStartedPayload, ServerToClientEvents, ClientToServerEvents } from '../../interfaces/socket';

interface PodPortForwardDrawerProps {
  open: boolean;
  onClose: () => void;
  namespace: string;
  podName: string;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  detectedPorts: number[];
}

type ForwardState = 'idle' | 'starting' | 'forwarding';

const isValidPort = (value: number) => Number.isInteger(value) && value >= 1 && value <= 65535;

export default function PodPortForwardDrawer({ open, onClose, namespace, podName, socket, detectedPorts }: PodPortForwardDrawerProps) {
  const normalizedPorts = useMemo(() => Array.from(new Set(detectedPorts)).sort((a, b) => a - b), [detectedPorts]);

  const defaultPort = normalizedPorts[0] ?? 8080;

  const [remotePort, setRemotePort] = useState(defaultPort);
  const [localPort, setLocalPort] = useState(defaultPort);
  const [state, setState] = useState<ForwardState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeMapping, setActiveMapping] = useState<PortForwardStartedPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    setRemotePort(defaultPort);
    setLocalPort(defaultPort);
    setState('idle');
    setError(null);
    setActiveMapping(null);
  }, [open, defaultPort]);

  useEffect(() => {
    if (!socket || !open) return;

    const onStarted = (payload: PortForwardStartedPayload) => {
      console.log('✅ [Frontend] Port forward started:', payload);
      setActiveMapping(payload);
      setState('forwarding');
      setError(null); // Ensure error is cleared on successful start
    };

    const onError = (payload: AppErrorPayload) => {
      console.error('❌ [Frontend] Port forward error:', payload);
      setState('idle');
      setError(payload.message || 'Port-forward failed');
      setActiveMapping(null);
    };

    socket.on('portforward:started', onStarted);
    socket.on('portforward:error', onError);

    // Safety timeout: if starting takes more than 10s, assume stuck and reset
    let timeoutId: number | null = null;
    const monitorStart = () => {
      if (state === 'starting') {
        timeoutId = setTimeout(() => {
          console.warn('⚠️ Port-forward startup timeout after 10s, resetting state');
          setState('idle');
          setError('Port-forward startup timeout. Check if pod/port is accessible.');
        }, 10000);
      }
    };

    monitorStart();

    return () => {
      socket.off('portforward:started', onStarted);
      socket.off('portforward:error', onError);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [socket, open, state]);

  const handleStart = () => {
    // Clear error BEFORE validation so it shows we're attempting a new forward
    setError(null);
    setActiveMapping(null);

    if (!socket) {
      setError('Socket connection is unavailable.');
      return;
    }

    if (!isValidPort(remotePort) || !isValidPort(localPort)) {
      setError('Ports must be between 1 and 65535.');
      return;
    }

    if (localPort < 1024) {
      setError('Local ports below 1024 usually require elevated privileges.');
      return;
    }

    setState('starting');
    console.log(`🎯 [Frontend] Emitting portforward:start: ${podName}:${remotePort} → localhost:${localPort}`);
    socket.emit('portforward:start', {
      namespace,
      podName,
      localPort,
      remotePort,
    });
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('portforward:stop');
    }
    setState('idle');
    setActiveMapping(null);
  };

  const handleClose = () => {
    handleStop();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsEthernetIcon color="primary" />
        Port Forward
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {namespace}/{podName}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {activeMapping && state === 'forwarding' && (
          <Alert severity="success">
            Forwarding localhost:{activeMapping.localPort} to pod port {activeMapping.remotePort}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="remote-port-label">Remote Port</InputLabel>
            <Select labelId="remote-port-label" label="Remote Port" value={remotePort} onChange={(e) => setRemotePort(Number(e.target.value))}>
              {normalizedPorts.map((port) => (
                <MenuItem key={port} value={port}>
                  {port}
                </MenuItem>
              ))}
              {!normalizedPorts.length && <MenuItem value={remotePort}>{remotePort}</MenuItem>}
            </Select>
          </FormControl>

          <TextField label="Local Port" type="number" fullWidth value={localPort} onChange={(e) => setLocalPort(Number(e.target.value))} inputProps={{ min: 1, max: 65535 }} />
        </Box>

        <Chip label="TCP only" size="small" sx={{ width: 'fit-content' }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Close</Button>
        {state === 'forwarding' ? (
          <Button onClick={handleStop} color="warning" variant="outlined">
            Stop
          </Button>
        ) : (
          <Button onClick={handleStart} variant="contained" disabled={state === 'starting'}>
            {state === 'starting' ? 'Starting...' : 'Start Forward'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
