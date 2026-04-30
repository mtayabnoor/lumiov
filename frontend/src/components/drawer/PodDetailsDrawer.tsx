import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Drawer, Box, Typography, IconButton, Divider, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Chip, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AppError {
  code: string;
  message: string;
  recoverable: boolean;
}

interface Pod {
  metadata?: {
    name?: string;
    namespace?: string;
  };
}

interface PodDetails {
  overview: any;
  containers: any[];
  events: any[];
  volumes: any[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

interface PodDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  pod: Pod | null;
  socket: Socket | null;
}

type ViewFormat = 'readable' | 'json';

interface FetchState {
  loading: boolean;
  error: AppError | null;
  details: PodDetails | null;
}

const INITIAL_FETCH_STATE: FetchState = { loading: false, error: null, details: null };
const LOADING_STATE: FetchState = { loading: true, error: null, details: null };

export default function PodDetailsDrawer({ open, onClose, pod, socket }: PodDetailsDrawerProps) {
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('readable');

  // Fetch pod details when drawer opens — single setState call avoids cascading renders
  useEffect(() => {
    if (!open || !pod || !socket) {
      return;
    }

    const namespace = pod.metadata?.namespace || 'default';
    const podName = pod.metadata?.name;

    if (!podName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchState({
        loading: false,
        error: { code: 'INVALID_POD', message: 'Pod name is missing', recoverable: false },
        details: null,
      });
      return;
    }

    // Kick off fetch — single state update to show loading
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetchState(LOADING_STATE);

    // Emit request to fetch pod details
    socket.emit('pod-details:fetch', { namespace, podName }, (err: AppError | null, data?: PodDetails) => {
      if (err) {
        setFetchState({ loading: false, error: err, details: null });
      } else if (data) {
        setFetchState({ loading: false, error: null, details: data });
      }
    });

    // Listen for data and error events (socket-based response)
    const handleData = (data: PodDetails) => {
      setFetchState({ loading: false, error: null, details: data });
    };

    const handleError = (err: AppError) => {
      setFetchState({ loading: false, error: err, details: null });
    };

    socket.on('pod-details:data', handleData);
    socket.on('pod-details:error', handleError);

    return () => {
      socket.off('pod-details:data', handleData);
      socket.off('pod-details:error', handleError);
    };
  }, [open, pod, socket]);

  const { loading, error, details } = fetchState;

  if (!pod) return null;

  const podName = pod.metadata?.name || 'Unknown Pod';
  const namespace = pod.metadata?.namespace || 'default';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '95%', sm: '680px' },
            height: 'calc(100vh - 50px)',
            marginTop: '50px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
        backdrop: { sx: { marginTop: '50px' } },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          minHeight: 56,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Pod Details
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            {namespace} / {podName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup value={viewFormat} exclusive onChange={(_, v) => v && setViewFormat(v)} size="small">
            <ToggleButton value="readable">Readable</ToggleButton>
            <ToggleButton value="json">JSON</ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={() => setFetchState((s) => ({ ...s, error: null }))}>
              <strong>{error.code}</strong> — {error.message}
            </Alert>
          </Box>
        )}

        {!loading && !error && !details && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>No pod details available</Typography>}

        {details && !loading && viewFormat === 'json' && (
          <Box sx={{ p: 2 }}>
            <Box
              component="pre"
              sx={{
                fontSize: '0.78rem',
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: 'text.secondary',
                m: 0,
                lineHeight: 1.6,
              }}
            >
              {JSON.stringify(details, null, 2)}
            </Box>
          </Box>
        )}

        {details && !loading && viewFormat === 'readable' && (
          <Box sx={{ pb: 4 }}>
            {/* ── Overview ── */}
            <Section title="Overview">
              <KVTable
                rows={[
                  ['Name', details.overview?.name],
                  ['Namespace', details.overview?.namespace],
                  ['Status', <StatusChip key="status" value={details.overview?.status} />],
                  ['Pod IP', details.overview?.podIP],
                  ['Host IP', details.overview?.hostIP],
                  ['Node', details.overview?.nodeName],
                  ['UID', details.overview?.uid],
                  ['QoS Class', details.overview?.qosClass],
                  ['Restart Policy', details.overview?.restartPolicy],
                  ['Service Account', details.overview?.serviceAccountName],
                  ['Created', fmtTime(details.overview?.creationTimestamp)],
                  ...(details.overview?.deletionTimestamp ? [['Deleting Since', fmtTime(details.overview?.deletionTimestamp)] as [string, any]] : []),
                ]}
              />
            </Section>

            {/* ── Containers ── */}
            {details.containers?.length > 0 && (
              <Section title={`Containers (${details.containers.length})`}>
                {details.containers.map((c: any, i: number) => (
                  <Box key={i} sx={{ mb: i < details.containers.length - 1 ? 3 : 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        px: 2,
                        pb: 0.5,
                        fontWeight: 700,
                        color: 'primary.main',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {c.name}
                    </Typography>
                    <KVTable
                      rows={[
                        ['Image', <MonoText key="img" value={c.image} />],
                        ['Pull Policy', c.imagePullPolicy],
                        ['Ready', c.ready ? 'Yes' : 'No'],
                        ['Restarts', String(c.restartCount ?? 0)],
                        ['State', c.state ? Object.keys(c.state)[0] : undefined],
                        ...(c.state?.waiting?.reason ? [['Reason', c.state.waiting.reason] as [string, any]] : []),
                        ...(c.state?.terminated?.exitCode !== undefined ? [['Exit Code', String(c.state.terminated.exitCode)] as [string, any]] : []),
                        ['CPU Request', c.resources?.requests?.cpu],
                        ['CPU Limit', c.resources?.limits?.cpu],
                        ['Memory Request', c.resources?.requests?.memory],
                        ['Memory Limit', c.resources?.limits?.memory],
                        ...(c.ports?.length ? [['Ports', c.ports.map((p: any) => `${p.containerPort}/${p.protocol ?? 'TCP'}`).join(', ')] as [string, any]] : []),
                        ...(c.volumeMounts?.length ? [['Mounts', c.volumeMounts.map((v: any) => `${v.name} → ${v.mountPath}${v.readOnly ? ' (ro)' : ''}`).join(', ')] as [string, any]] : []),
                      ]}
                    />
                    {i < details.containers.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </Section>
            )}

            {/* ── Events ── */}
            {details.events?.length > 0 && (
              <Section title={`Events (${details.events.length})`}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '44%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      {['Type', 'Reason', 'Message', 'Count', 'Last Seen'].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            px: 2,
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'action.hover',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.events.map((ev: any, i: number) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell sx={{ px: 2, py: 0.75, verticalAlign: 'top' }}>
                          <Chip label={ev.type ?? '—'} size="small" color={ev.type === 'Warning' ? 'warning' : 'default'} sx={{ fontSize: '0.7rem', height: 20 }} />
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 2,
                            py: 0.75,
                            verticalAlign: 'top',
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            color: 'text.primary',
                            wordBreak: 'break-word',
                          }}
                        >
                          {ev.reason ?? '—'}
                        </TableCell>
                        <TableCell
                          sx={{
                            px: 2,
                            py: 0.75,
                            verticalAlign: 'top',
                            fontSize: '0.78rem',
                            color: 'text.secondary',
                            wordBreak: 'break-word',
                          }}
                        >
                          {ev.message ?? '—'}
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, verticalAlign: 'top', fontSize: '0.78rem', textAlign: 'center' }}>{ev.count ?? 1}</TableCell>
                        <TableCell sx={{ px: 1, py: 0.75, verticalAlign: 'top', fontSize: '0.75rem', color: 'text.secondary', wordBreak: 'break-word' }}>{fmtTime(ev.lastTimestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Section>
            )}

            {/* ── Volumes ── */}
            {details.volumes?.length > 0 && (
              <Section title={`Volumes (${details.volumes.length})`}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                      <TableRow>
                        {['Name', 'Type', 'Details'].map((h) => (
                          <TableCell
                            key={h}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                              px: 2,
                              py: 1,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'action.hover',
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.volumes.map((v: any, i: number) => (
                        <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ px: 2, py: 0.75, fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.primary' }}>{v.name}</TableCell>
                          <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.78rem', color: 'text.secondary' }}>{v.type}</TableCell>
                          <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.75rem', color: 'text.secondary', wordBreak: 'break-all' }}>
                            {v.details ? JSON.stringify(v.details, null, 0).replace(/[{}"]/g, '').replace(/,/g, ', ') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Section>
            )}

            {/* ── Labels ── */}
            {Object.keys(details.labels ?? {}).length > 0 && (
              <Section title="Labels">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 2 }}>
                  {Object.entries(details.labels).map(([k, v]) => (
                    <Chip key={k} label={`${k}=${v}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', height: 22 }} />
                  ))}
                </Box>
              </Section>
            )}

            {/* ── Annotations ── */}
            {Object.keys(details.annotations ?? {}).length > 0 && (
              <Section title="Annotations">
                <KVTable rows={Object.entries(details.annotations).map(([k, v]) => [k, v] as [string, any])} monoKey />
              </Section>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function fmtTime(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function MonoText({ value }: { value?: string }) {
  return (
    <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
      {value ?? '—'}
    </Typography>
  );
}

function StatusChip({ value }: { value?: string }) {
  const color = value === 'Running' ? 'success' : value === 'Pending' ? 'warning' : value === 'Failed' ? 'error' : 'default';
  return <Chip label={value ?? '—'} size="small" color={color as any} sx={{ fontSize: '0.72rem', height: 20, fontWeight: 600 }} />;
}

// Section wrapper with sticky title
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box
        sx={{
          px: 2,
          py: 1,
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'text.secondary',
            fontSize: '0.72rem',
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ py: 1.5 }}>{children}</Box>
    </Box>
  );
}

// Key-value table row list
function KVTable({ rows, monoKey }: { rows: [string, any][]; monoKey?: boolean }) {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
      <colgroup>
        <col style={{ width: '38%' }} />
        <col style={{ width: '62%' }} />
      </colgroup>
      <TableBody>
        {rows
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([label, value]) => (
            <TableRow key={label} sx={{ '&:hover': { bgcolor: 'action.hover' }, verticalAlign: 'top' }}>
              <TableCell
                sx={{
                  px: 2,
                  py: 0.75,
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  color: 'text.secondary',
                  fontFamily: monoKey ? 'monospace' : 'inherit',
                  borderBottom: 'none',
                  wordBreak: 'break-word',
                  verticalAlign: 'top',
                }}
              >
                {label}
              </TableCell>
              <TableCell
                sx={{
                  px: 2,
                  py: 0.75,
                  fontSize: '0.82rem',
                  color: 'text.primary',
                  borderBottom: 'none',
                  wordBreak: 'break-word',
                  verticalAlign: 'top',
                }}
              >
                {value}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
