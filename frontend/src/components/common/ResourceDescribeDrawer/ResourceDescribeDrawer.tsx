import { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Chip, Table, TableBody, TableRow, TableCell, TableHead } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { API_PATH } from '../../../config/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface AppError {
  code: string;
  message: string;
  recoverable: boolean;
}

interface ContainerDetail {
  name: string;
  image?: string;
  imagePullPolicy?: string;
  ports?: Array<{ containerPort: number; protocol?: string; name?: string }>;
  resources?: { requests?: Record<string, string>; limits?: Record<string, string> };
  env?: Array<{ name: string; value?: string; valueFrom?: any }>;
  volumeMounts?: Array<{ name: string; mountPath: string; readOnly?: boolean }>;
  command?: string[];
  args?: string[];
  livenessProbe?: any;
  readinessProbe?: any;
  startupProbe?: any;
  ready?: boolean;
  restartCount?: number;
  state?: { running?: { startedAt?: string }; waiting?: { reason?: string; message?: string }; terminated?: { reason?: string; exitCode?: number; finishedAt?: string } };
}

interface VolumeDetail {
  name: string;
  type: string;
  details: Record<string, any>;
}

interface DescribeDetails {
  metadata: Record<string, any>;
  overview: Record<string, string | number | boolean | undefined>;
  conditions: { type: string; status: string; reason?: string; message?: string; lastTransitionTime?: string }[];
  events: any[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  containers?: ContainerDetail[];
  initContainers?: ContainerDetail[];
  volumes?: VolumeDetail[];
  raw: any;
}

interface ResourceDescribeDrawerProps {
  open: boolean;
  onClose: () => void;
  apiVersion: string;
  kind: string;
  namespace: string;
  name: string;
}

type ViewFormat = 'readable' | 'json';

interface FetchState {
  loading: boolean;
  error: AppError | null;
  details: DescribeDetails | null;
}

const INITIAL: FetchState = { loading: false, error: null, details: null };
const LOADING: FetchState = { loading: true, error: null, details: null };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResourceDescribeDrawer({ open, onClose, apiVersion, kind, namespace, name }: ResourceDescribeDrawerProps) {
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('readable');

  useEffect(() => {
    if (!open || !kind || !name) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetchState(LOADING);

    const params = new URLSearchParams({ kind, name });
    if (apiVersion) params.set('apiVersion', apiVersion);
    if (namespace) params.set('namespace', namespace);

    fetch(`${API_PATH}/resource/describe?${params.toString()}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      })
      .then((data: DescribeDetails) => {
        setFetchState({ loading: false, error: null, details: data });
      })
      .catch((err: any) => {
        setFetchState({
          loading: false,
          error: {
            code: err?.code ?? 'DESCRIBE_FAILED',
            message: err?.message ?? 'Failed to load resource details',
            recoverable: err?.recoverable ?? true,
          },
          details: null,
        });
      });
  }, [open, apiVersion, kind, namespace, name]);

  // Reset on close
  useEffect(() => {
    if (!open) setFetchState(INITIAL);
  }, [open]);

  const { loading, error, details } = fetchState;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '95%', sm: '860px' },
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
            {kind} Details
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            {namespace ? `${namespace} / ${name}` : name}
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

        {!loading && !error && !details && <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 8 }}>No details available</Typography>}

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
              {JSON.stringify(details.raw, null, 2)}
            </Box>
          </Box>
        )}

        {details && !loading && viewFormat === 'readable' && (
          <Box sx={{ pb: 4 }}>
            {/* ── Metadata ── */}
            <Section title="Metadata">
              <KVTable
                rows={[
                  ['Name', details.metadata?.name],
                  ['Namespace', details.metadata?.namespace],
                  ['UID', details.metadata?.uid],
                  ['Created', fmtTime(details.metadata?.creationTimestamp)],
                  ...(details.metadata?.deletionTimestamp ? [['Deleting Since', fmtTime(details.metadata?.deletionTimestamp)] as [string, any]] : []),
                  ['Generation', details.metadata?.generation],
                  ['Resource Version', details.metadata?.resourceVersion],
                ]}
              />
            </Section>

            {/* ── Kind-specific overview ── */}
            {Object.keys(details.overview ?? {}).length > 0 && (
              <Section title={kind}>
                <KVTable rows={Object.entries(details.overview).map(([k, v]) => [k, v !== undefined && v !== null ? String(v) : undefined] as [string, any])} />
              </Section>
            )}

            {/* ── Init Containers ── */}
            {(details.initContainers?.length ?? 0) > 0 && (
              <Section title={`Init Containers (${details.initContainers!.length})`}>
                {details.initContainers!.map((c) => (
                  <ContainerInfo key={c.name} container={c} />
                ))}
              </Section>
            )}

            {/* ── Containers ── */}
            {(details.containers?.length ?? 0) > 0 && (
              <Section title={`Containers (${details.containers!.length})`}>
                {details.containers!.map((c) => (
                  <ContainerInfo key={c.name} container={c} />
                ))}
              </Section>
            )}

            {/* ── Volumes ── */}
            {(details.volumes?.length ?? 0) > 0 && (
              <Section title={`Volumes (${details.volumes!.length})`}>
                <KVTable rows={details.volumes!.map((v) => [v.name, v.type] as [string, any])} />
              </Section>
            )}

            {/* ── Conditions ── */}
            {details.conditions?.length > 0 && (
              <Section title={`Conditions (${details.conditions.length})`}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      {['Type', 'Status', 'Reason', 'Message', 'Since'].map((h) => (
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
                            bgcolor: 'action.hover',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.conditions.map((c, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.78rem', fontFamily: 'monospace', verticalAlign: 'top', wordBreak: 'break-all' }}>{c.type}</TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, verticalAlign: 'top' }}>
                          <Chip label={c.status} size="small" color={c.status === 'True' ? 'success' : c.status === 'False' ? 'error' : 'default'} sx={{ fontSize: '0.7rem', height: 20 }} />
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.78rem', color: 'text.secondary', verticalAlign: 'top', wordBreak: 'break-word' }}>{c.reason ?? '—'}</TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.75rem', color: 'text.secondary', verticalAlign: 'top', wordBreak: 'break-word' }}>{c.message ?? '—'}</TableCell>
                        <TableCell sx={{ px: 1, py: 0.75, fontSize: '0.75rem', color: 'text.secondary', verticalAlign: 'top', wordBreak: 'break-word' }}>{fmtTime(c.lastTransitionTime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                            bgcolor: 'action.hover',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
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
                        <TableCell sx={{ px: 2, py: 0.75, fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.primary', verticalAlign: 'top', wordBreak: 'break-word' }}>
                          {ev.reason ?? '—'}
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.78rem', color: 'text.secondary', verticalAlign: 'top', wordBreak: 'break-word' }}>{ev.message ?? '—'}</TableCell>
                        <TableCell sx={{ px: 2, py: 0.75, fontSize: '0.78rem', textAlign: 'center', verticalAlign: 'top' }}>{ev.count ?? 1}</TableCell>
                        <TableCell sx={{ px: 1, py: 0.75, fontSize: '0.75rem', color: 'text.secondary', verticalAlign: 'top', wordBreak: 'break-word' }}>{fmtTime(ev.lastTimestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

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
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontSize: '0.72rem' }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ py: 1.5 }}>{children}</Box>
    </Box>
  );
}

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
            <TableRow key={label} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
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

function fmtContainerState(state: ContainerDetail['state']): string {
  if (!state) return '—';
  if (state.running) return `Running (started ${fmtTime(state.running.startedAt)})`;
  if (state.waiting) return `Waiting: ${state.waiting.reason ?? 'Unknown'}${state.waiting.message ? ' — ' + state.waiting.message : ''}`;
  if (state.terminated) return `Terminated: ${state.terminated.reason ?? 'exit ' + state.terminated.exitCode} (${fmtTime(state.terminated.finishedAt)})`;
  return '—';
}

function fmtProbe(probe: any): string | undefined {
  if (!probe) return undefined;
  const parts: string[] = [];
  if (probe.httpGet) parts.push(`HTTP GET :${probe.httpGet.port}${probe.httpGet.path ?? ''}`);
  else if (probe.tcpSocket) parts.push(`TCP :${probe.tcpSocket.port}`);
  else if (probe.exec?.command) parts.push(`exec [${probe.exec.command.join(' ')}]`);
  if (probe.initialDelaySeconds !== undefined) parts.push(`delay=${probe.initialDelaySeconds}s`);
  if (probe.periodSeconds !== undefined) parts.push(`period=${probe.periodSeconds}s`);
  if (probe.failureThreshold !== undefined) parts.push(`failThresh=${probe.failureThreshold}`);
  return parts.join(', ') || undefined;
}

function ContainerInfo({ container: c }: { container: ContainerDetail }) {
  const ports = (c.ports || []).map((p) => `${p.containerPort}/${p.protocol ?? 'TCP'}${p.name ? ' (' + p.name + ')' : ''}`).join(', ');
  const mounts = (c.volumeMounts || []).map((m) => `${m.mountPath}${m.readOnly ? ' (ro)' : ''}`).join(', ');
  const envVars = (c.env || [])
    .map((e) => {
      if (e.value !== undefined) return `${e.name}=***`;
      if (e.valueFrom?.fieldRef) return `${e.name}=(fieldRef: ${e.valueFrom.fieldRef.fieldPath})`;
      if (e.valueFrom?.secretKeyRef) return `${e.name}=(secret: ${e.valueFrom.secretKeyRef.name})`;
      if (e.valueFrom?.configMapKeyRef) return `${e.name}=(cm: ${e.valueFrom.configMapKeyRef.name})`;
      return e.name;
    })
    .join(', ');

  const rows: [string, any][] = [
    ['Image', c.image],
    ['Pull Policy', c.imagePullPolicy],
    ['State', fmtContainerState(c.state)],
    ['Ready', c.ready !== undefined ? (c.ready ? 'Yes' : 'No') : undefined],
    ['Restarts', c.restartCount],
    ['Ports', ports || undefined],
    ['CPU Request', c.resources?.requests?.cpu],
    ['CPU Limit', c.resources?.limits?.cpu],
    ['Memory Request', c.resources?.requests?.memory],
    ['Memory Limit', c.resources?.limits?.memory],
    ['Command', c.command?.join(' ') || undefined],
    ['Args', c.args?.join(' ') || undefined],
    ['Env Vars', envVars || undefined],
    ['Volume Mounts', mounts || undefined],
    ['Liveness', fmtProbe(c.livenessProbe)],
    ['Readiness', fmtProbe(c.readinessProbe)],
    ['Startup', fmtProbe(c.startupProbe)],
  ];

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ px: 2, py: 0.5, bgcolor: 'action.selected', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {c.name}
        </Typography>
      </Box>
      <KVTable rows={rows} />
    </Box>
  );
}
