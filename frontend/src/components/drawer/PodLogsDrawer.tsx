import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Popover,
  Slider,
  Switch,
  FormControlLabel,
  Badge,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DownloadIcon from '@mui/icons-material/Download';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import ArticleIcon from '@mui/icons-material/Article';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import WrapTextIcon from '@mui/icons-material/WrapText';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HistoryIcon from '@mui/icons-material/History';

import {
  DRAWER_STYLES,
  getDrawerPaperSx,
  DRAWER_HEADER_SX,
  getSelectSx,
  getMenuProps,
  ICON_BUTTON_SX,
  CONNECTED_CHIP_SX,
  PULSE_DOT_SX,
  DIVIDER_SX,
} from './drawerStyles';

// --- Types ---
interface Container {
  name: string;
}

interface PodLogsDrawerProps {
  open: boolean;
  onClose: () => void;
  namespace: string;
  podName: string;
  containers: Container[];
  defaultContainer?: string;
  socket: Socket | null;
}

interface LogLine {
  id: number;
  timestamp: string;
  content: string;
  raw: string;
  level: LogLevel;
  container?: string; // Container name for multi-container mode
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'unknown';

// Container color palette for multi-container mode
const CONTAINER_COLORS = [
  '#60a5fa', // Blue
  '#f472b6', // Pink
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#a78bfa', // Purple
  '#f87171', // Red
  '#38bdf8', // Sky
  '#fb923c', // Orange
];

const getContainerColor = (containerName: string, containers: string[]): string => {
  const index = containers.indexOf(containerName);
  return CONTAINER_COLORS[index % CONTAINER_COLORS.length];
};

interface LogRowProps {
  logs: LogLine[];
  showTimestamps: boolean;
  wrapLines: boolean;
  fontSize: number;
  highlightTerms: string[];
  containers: string[]; // For color mapping
  showContainer: boolean; // Whether to show container name column
}

// --- Constants ---
const LINE_HEIGHT = 22;
const DEFAULT_TAIL_LINES = 1000;
const TAIL_OPTIONS = [100, 500, 1000, 5000, 10000, -1];

// Time-based filtering options
type TimeFilterMode = 'lines' | 'time';
interface TimeOption {
  label: string;
  seconds: number;
}
const TIME_OPTIONS: TimeOption[] = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: '6 hours', seconds: 21600 },
  { label: '24 hours', seconds: 86400 },
];

// --- Helpers ---
const detectLogLevel = (content: string): LogLevel => {
  const lower = content.toLowerCase();
  if (lower.includes('error') || lower.includes('fatal') || lower.includes('exception'))
    return 'error';
  if (lower.includes('warn')) return 'warn';
  if (lower.includes('info')) return 'info';
  if (lower.includes('debug') || lower.includes('trace')) return 'debug';
  return 'unknown';
};

// Parse log line - extract container name if present (format: [container-name] content)
const parseLogLine = (line: string, id: number): LogLine => {
  let workingLine = line;
  let container: string | undefined;

  // Check for container tag [container-name]
  const containerMatch = line.match(/^\[([^\]]+)\]\s*/);
  if (containerMatch) {
    container = containerMatch[1];
    workingLine = line.slice(containerMatch[0].length);
  }

  const timestampMatch = workingLine.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*/);
  const content = timestampMatch
    ? workingLine.slice(timestampMatch[0].length)
    : workingLine;

  return {
    id,
    timestamp: timestampMatch ? timestampMatch[1] : '',
    content,
    raw: line,
    level: detectLogLevel(content),
    container,
  };
};

const downloadLogs = (logs: LogLine[], podName: string, format: 'txt' | 'json') => {
  let content: string;
  let mimeType: string;
  let ext: string;

  if (format === 'json') {
    content = JSON.stringify(
      logs.map((l) => ({
        timestamp: l.timestamp,
        level: l.level,
        message: l.content,
      })),
      null,
      2,
    );
    mimeType = 'application/json';
    ext = 'json';
  } else {
    content = logs.map((l) => l.raw).join('\n');
    mimeType = 'text/plain';
    ext = 'txt';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${podName}-logs-${new Date().toISOString().slice(0, 10)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const highlightText = (text: string, terms: string[]): React.ReactNode => {
  if (!terms.length) return text;

  const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <Box
        key={i}
        component="span"
        sx={{
          bgcolor: 'rgba(250, 204, 21, 0.4)',
          borderRadius: '2px',
          px: 0.25,
        }}
      >
        {part}
      </Box>
    ) : (
      part
    ),
  );
};

// Level colors
const LEVEL_COLORS: Record<LogLevel, string> = {
  error: DRAWER_STYLES.status.error.text,
  warn: DRAWER_STYLES.status.warning.text,
  info: '#60a5fa', // Blue
  debug: '#a78bfa', // Purple
  unknown: DRAWER_STYLES.text.secondary,
};

const LEVEL_BORDER_COLORS: Record<LogLevel, string> = {
  error: DRAWER_STYLES.status.error.text,
  warn: DRAWER_STYLES.status.warning.text,
  info: 'transparent',
  debug: 'transparent',
  unknown: 'transparent',
};

// --- Row Component ---
function LogRow({
  index,
  style,
  logs,
  showTimestamps,
  wrapLines,
  fontSize,
  highlightTerms,
  containers,
  showContainer,
}: RowComponentProps<LogRowProps>) {
  const log = logs[index];
  if (!log) return null;

  // Get container color for multi-container mode
  const containerColor = log.container
    ? getContainerColor(log.container, containers)
    : DRAWER_STYLES.text.muted;

  return (
    <Box
      style={style}
      sx={{
        display: 'flex',
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: `${fontSize}px`,
        lineHeight: `${LINE_HEIGHT}px`,
        px: 1.5,
        boxSizing: 'border-box',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.02)',
        },
        borderLeft: log.container
          ? `3px solid ${containerColor}`
          : `2px solid ${LEVEL_BORDER_COLORS[log.level]}`,
      }}
    >
      {/* Line number */}
      <Typography
        component="span"
        sx={{
          color: DRAWER_STYLES.text.muted,
          minWidth: 50,
          textAlign: 'right',
          mr: 2,
          userSelect: 'none',
          fontSize: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        {log.id + 1}
      </Typography>

      {/* Container name (only in multi-container mode) */}
      {showContainer && log.container && (
        <Typography
          component="span"
          sx={{
            color: containerColor,
            minWidth: 100,
            maxWidth: 120,
            mr: 1,
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {log.container}
        </Typography>
      )}

      {/* Level indicator */}
      <Typography
        component="span"
        sx={{
          color: LEVEL_COLORS[log.level],
          minWidth: 50,
          mr: 1,
          fontSize: 'inherit',
          fontFamily: 'inherit',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {log.level !== 'unknown' ? log.level.slice(0, 4) : ''}
      </Typography>

      {/* Timestamp */}
      {showTimestamps && log.timestamp && (
        <Typography
          component="span"
          sx={{
            color: DRAWER_STYLES.status.connected.text,
            minWidth: 200,
            mr: 2,
            fontSize: 'inherit',
            fontFamily: 'inherit',
          }}
        >
          {log.timestamp}
        </Typography>
      )}

      {/* Content */}
      <Typography
        component="span"
        sx={{
          color: '#e6e6e6',
          flex: 1,
          whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
          wordBreak: wrapLines ? 'break-all' : 'normal',
          overflow: 'hidden',
          textOverflow: wrapLines ? 'clip' : 'ellipsis',
          fontSize: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        {highlightText(log.content, highlightTerms)}
      </Typography>
    </Box>
  );
}

// --- Settings Popover ---
interface SettingsPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  // Mode & filtering
  filterMode: TimeFilterMode;
  setFilterMode: (v: TimeFilterMode) => void;
  tailLines: number;
  setTailLines: (v: number) => void;
  sinceSeconds: number;
  setSinceSeconds: (v: number) => void;
  // Streaming
  isLive: boolean;
  setIsLive: (v: boolean) => void;
  // Display
  showTimestamps: boolean;
  setShowTimestamps: (v: boolean) => void;
  wrapLines: boolean;
  setWrapLines: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  showPrevious: boolean;
  setShowPrevious: (v: boolean) => void;
}

function SettingsPopover({
  anchorEl,
  onClose,
  filterMode,
  setFilterMode,
  tailLines,
  setTailLines,
  sinceSeconds,
  setSinceSeconds,
  isLive,
  setIsLive,
  showTimestamps,
  setShowTimestamps,
  wrapLines,
  setWrapLines,
  fontSize,
  setFontSize,
  showPrevious,
  setShowPrevious,
}: SettingsPopoverProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: DRAWER_STYLES.paper.headerBg,
            border: `1px solid ${DRAWER_STYLES.controls.inputBorder}`,
            minWidth: 280,
            p: 2,
          },
        },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: DRAWER_STYLES.text.primary, mb: 2, fontWeight: 600 }}
      >
        Log Settings
      </Typography>

      {/* Filter Mode Toggle */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: DRAWER_STYLES.text.secondary, display: 'block', mb: 1 }}
        >
          Filter Mode
        </Typography>
        <ToggleButtonGroup
          value={filterMode}
          exclusive
          onChange={(_, v) => v && setFilterMode(v)}
          size="small"
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              color: DRAWER_STYLES.text.secondary,
              borderColor: DRAWER_STYLES.controls.inputBorder,
            },
          }}
        >
          <ToggleButton
            value="lines"
            sx={{
              '&.Mui-selected': {
                bgcolor: DRAWER_STYLES.menu.itemSelected,
                color: DRAWER_STYLES.text.primary,
              },
            }}
          >
            Last N Lines
          </ToggleButton>
          <ToggleButton
            value="time"
            sx={{
              '&.Mui-selected': {
                bgcolor: DRAWER_STYLES.menu.itemSelected,
                color: DRAWER_STYLES.text.primary,
              },
            }}
          >
            Time Range
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Tail Lines (only when mode is lines) */}
      {filterMode === 'lines' && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: DRAWER_STYLES.text.secondary,
              display: 'block',
              mb: 1,
            }}
          >
            Tail Lines: {tailLines === -1 ? 'All' : tailLines.toLocaleString()}
          </Typography>
          <ToggleButtonGroup
            value={tailLines}
            exclusive
            onChange={(_, v) => v && setTailLines(v)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: DRAWER_STYLES.text.secondary,
                borderColor: DRAWER_STYLES.controls.inputBorder,
                px: 1.5,
              },
            }}
          >
            {TAIL_OPTIONS.map((n) => (
              <ToggleButton
                key={n}
                value={n}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: DRAWER_STYLES.menu.itemSelected,
                    color: DRAWER_STYLES.text.primary,
                  },
                }}
              >
                {n === -1 ? 'All' : n >= 1000 ? `${n / 1000}k` : n}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Time Range (only when mode is time) */}
      {filterMode === 'time' && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: DRAWER_STYLES.text.secondary,
              display: 'block',
              mb: 1,
            }}
          >
            Show logs from last:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {TIME_OPTIONS.map((opt) => (
              <Chip
                key={opt.seconds}
                label={opt.label}
                size="small"
                onClick={() => setSinceSeconds(opt.seconds)}
                sx={{
                  bgcolor:
                    sinceSeconds === opt.seconds
                      ? DRAWER_STYLES.menu.itemSelected
                      : DRAWER_STYLES.controls.inputBg,
                  color:
                    sinceSeconds === opt.seconds
                      ? DRAWER_STYLES.text.primary
                      : DRAWER_STYLES.text.secondary,
                  border:
                    sinceSeconds === opt.seconds
                      ? `1px solid ${DRAWER_STYLES.controls.inputBorderHover}`
                      : '1px solid transparent',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: DRAWER_STYLES.menu.itemHover },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Font Size */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: DRAWER_STYLES.text.secondary, display: 'block', mb: 1 }}
        >
          Font Size: {fontSize}px
        </Typography>
        <Slider
          value={fontSize}
          onChange={(_, v) => setFontSize(v as number)}
          min={10}
          max={18}
          step={1}
          marks
          sx={{
            color: 'primary.main',
            '& .MuiSlider-markLabel': { color: DRAWER_STYLES.text.muted },
          }}
        />
      </Box>

      {/* Toggles */}
      <FormControlLabel
        control={
          <Switch
            checked={showTimestamps}
            onChange={(e) => setShowTimestamps(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="body2" sx={{ color: DRAWER_STYLES.text.primary }}>
            Show Timestamps
          </Typography>
        }
        sx={{ mb: 1 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={wrapLines}
            onChange={(e) => setWrapLines(e.target.checked)}
            size="small"
          />
        }
        label={
          <Typography variant="body2" sx={{ color: DRAWER_STYLES.text.primary }}>
            Wrap Lines
          </Typography>
        }
        sx={{ mb: 1 }}
      />

      {/* Live/Snapshot Mode Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={isLive}
            onChange={(e) => setIsLive(e.target.checked)}
            size="small"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2" sx={{ color: DRAWER_STYLES.text.primary }}>
              {isLive ? 'Live Streaming' : 'Snapshot Mode'}
            </Typography>
            <Chip
              size="small"
              label={isLive ? 'LIVE' : 'SNAP'}
              sx={{
                height: 16,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: isLive
                  ? DRAWER_STYLES.status.connected.bg
                  : 'rgba(255,255,255,0.1)',
                color: isLive
                  ? DRAWER_STYLES.status.connected.text
                  : DRAWER_STYLES.text.muted,
              }}
            />
          </Box>
        }
        sx={{ mb: 1 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={showPrevious}
            onChange={(e) => setShowPrevious(e.target.checked)}
            size="small"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            <HistoryIcon sx={{ fontSize: 16, color: DRAWER_STYLES.text.secondary }} />
            <Typography variant="body2" sx={{ color: DRAWER_STYLES.text.primary }}>
              Previous Container Logs
            </Typography>
          </Box>
        }
      />
    </Popover>
  );
}

// --- Main Component ---
export default function PodLogsDrawer({
  open,
  onClose,
  namespace,
  podName,
  containers,
  defaultContainer,
  socket,
}: PodLogsDrawerProps) {
  const theme = useTheme();
  const listRef = useRef<ListImperativeAPI>(null);

  // --- State ---
  const [selectedContainer, setSelectedContainer] = useState(
    defaultContainer || containers[0]?.name || '',
  );
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState('50vh');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // New state to track buffered count for render (fixes refs-in-render error)
  const [bufferedCount, setBufferedCount] = useState(0);

  // Advanced settings
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('lines');
  const [tailLines, setTailLines] = useState(DEFAULT_TAIL_LINES);
  const [sinceSeconds, setSinceSeconds] = useState(300); // Default 5 minutes
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [showPrevious, setShowPrevious] = useState(false);
  const [isLive, setIsLive] = useState(true); // true = live streaming, false = snapshot
  const [levelFilters, setLevelFilters] = useState<LogLevel[]>([
    'error',
    'warn',
    'info',
    'debug',
    'unknown',
  ]);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

  // --- Refs ---
  const lineIdRef = useRef(0);
  const pausedLogsRef = useRef<LogLine[]>([]);
  const isPausedRef = useRef(false);

  // Sync isPausedRef with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Log statistics
  const stats = { error: 0, warn: 0, info: 0, debug: 0, unknown: 0 };

  // The compiler sees this loop and knows 'stats' depends entirely on 'logs'
  logs.forEach((l) => {
    // Defensive check: handle levels that might not exist in your stats object
    const level = l.level in stats ? l.level : 'unknown';
    stats[level]++;
  });

  const logStats = stats;

  // Highlight terms from search
  const highlightTerms = searchQuery.trim() ? [searchQuery] : [];

  // Filtered logs
  let filtered = logs.filter((log) => levelFilters.includes(log.level));

  if (searchQuery.trim()) {
    if (isRegex) {
      try {
        const regex = new RegExp(searchQuery, 'i');
        filtered = filtered.filter(
          (log) => regex.test(log.content) || regex.test(log.timestamp),
        );
      } catch {
        // Invalid regex, fall back to literal search
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.content.toLowerCase().includes(query) ||
            log.timestamp.toLowerCase().includes(query),
        );
      }
    } else {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.content.toLowerCase().includes(query) ||
          log.timestamp.toLowerCase().includes(query),
      );
    }
  }

  const filteredLogs = filtered;

  // Reset on open
  // Reset on open effect removed to fix set-state-in-effect.
  // Cleanup is handled in handleClose.

  // Subscribe to logs
  useEffect(() => {
    if (!open || !socket || !selectedContainer) return;

    console.log(
      `📜 [Logs] Subscribing: ${podName}/${selectedContainer} (tail: ${tailLines}, previous: ${showPrevious})`,
    );

    // Clear error before new subscription - handled by onChange or Close
    // setError(null);

    const handleLogData = (data: string) => {
      const newLines = data
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => parseLogLine(line, lineIdRef.current++));

      if (isPausedRef.current) {
        pausedLogsRef.current = [...pausedLogsRef.current, ...newLines];
        setBufferedCount(pausedLogsRef.current.length);
        return;
      }

      setLogs((prev) => {
        const updated = [...prev, ...newLines];
        return updated.length > tailLines ? updated.slice(-tailLines) : updated;
      });

      setIsConnected(true);
    };

    const handleLogError = (err: string) => {
      console.error('❌ [Logs] Error:', err);
      setError(typeof err === 'string' ? err : 'Unknown error');
    };

    socket.on('logs:data', handleLogData);
    socket.on('logs:error', handleLogError);

    // Build subscription options based on filter mode
    const subscribeOptions: any = {
      namespace,
      podName,
      containerName: selectedContainer,
      containers: containers.map((c) => c.name), // Send all container names for multi-container mode
      previous: showPrevious,
      timestamps: true,
      follow: isLive, // Live = stream continuously, Snapshot = fetch once
    };

    if (filterMode === 'time') {
      subscribeOptions.sinceSeconds = sinceSeconds;
    } else {
      subscribeOptions.tailLines = tailLines;
    }

    socket.emit('logs:subscribe', subscribeOptions);

    return () => {
      console.log(`📜 [Logs] Unsubscribing: ${podName}/${selectedContainer}`);
      socket.emit('logs:unsubscribe');
      socket.off('logs:data', handleLogData);
      socket.off('logs:error', handleLogError);
    };
  }, [
    open,
    socket,
    namespace,
    podName,
    selectedContainer,
    filterMode,
    tailLines,
    sinceSeconds,
    showPrevious,
    isLive,
    containers, // Added to deps
  ]);

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({
        index: filteredLogs.length - 1,
        align: 'end',
      });
    }
  }, [filteredLogs.length, isPaused]);

  const handleResume = () => {
    setLogs((prev) => [...prev, ...pausedLogsRef.current].slice(-tailLines));
    pausedLogsRef.current = [];
    setBufferedCount(0);
    setIsPaused(false);
  };

  const handleClear = () => {
    setLogs([]);
    pausedLogsRef.current = [];
    setBufferedCount(0);
    lineIdRef.current = 0;
  };

  const handleScrollToBottom = () => {
    if (listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({
        index: filteredLogs.length - 1,
        align: 'end',
      });
    }
  };

  const handleCopy = async () => {
    const text = filteredLogs.map((l) => l.raw).join('\n');
    const success = await copyToClipboard(text);
    setCopySuccess(success);
    if (success) {
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleClose = () => {
    if (socket) {
      socket.emit('logs:unsubscribe');
    }

    setLogs([]);
    lineIdRef.current = 0;
    pausedLogsRef.current = [];
    setBufferedCount(0); // Clear buffer state
    setError(null);
    setIsConnected(false);
    setIsPaused(false);
    setSearchQuery('');
    // Reset container to default if needed, or leave it.
    // Setting it here might cause "set state after unmount" if onClose unmounts parent, but onClose is prop.
    if (defaultContainer) setSelectedContainer(defaultContainer);

    onClose();
  };

  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const toggleHeight = () => setHeight((h) => (h === '50vh' ? '85vh' : '50vh'));

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: getDrawerPaperSx(height),
        },
      }}
    >
      {/* --- HEADER --- */}
      <Box sx={DRAWER_HEADER_SX}>
        {/* Left: Pod Info */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* Icon & Title */}
          <Box display="flex" alignItems="center" gap={1}>
            <ArticleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
            <Box display="flex" flexDirection="column">
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {podName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.contrastText',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                }}
              >
                {namespace}
              </Typography>
            </Box>
          </Box>

          {/* Container Selector */}
          {containers.length > 1 && (
            <>
              <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption">Container:</Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={selectedContainer}
                    onChange={(e) => {
                      setSelectedContainer(e.target.value);
                      setError(null); // Clear error on change
                    }}
                    displayEmpty
                    variant="outlined"
                  >
                    {/* All Containers option */}
                    <MenuItem value="all">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #60a5fa, #f472b6, #34d399)',
                          }}
                        />
                        All Containers
                      </Box>
                    </MenuItem>
                    {containers.map((c, idx) => (
                      <MenuItem key={c.name} value={c.name}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: CONTAINER_COLORS[idx % CONTAINER_COLORS.length],
                            }}
                          />
                          {c.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          )}

          <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />

          {/* Search */}
          <TextField
            size="small"
            placeholder={isRegex ? 'Regex pattern...' : 'Search logs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={isRegex ? 'Regex mode ON' : 'Enable regex'}>
                      <IconButton
                        size="small"
                        onClick={() => setIsRegex(!isRegex)}
                        sx={{
                          p: 0.5,
                        }}
                      >
                        <Typography sx={{ fontSize: 10, fontWeight: 700 }}>.*</Typography>
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: 220,
              '& .MuiOutlinedInput-root': {
                height: 32,

                fontSize: '0.875rem',
                bgcolor: 'transparent',
                border: 'none',
                '& fieldset': {
                  borderColor: 'primary.contrastText',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <Divider orientation="vertical" flexItem sx={DIVIDER_SX} />

          {/* Level Filters */}
          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title={`Errors: ${logStats.error}`}>
              <IconButton
                size="small"
                onClick={() => toggleLevelFilter('error')}
                sx={{
                  ...ICON_BUTTON_SX,
                  color: levelFilters.includes('error')
                    ? LEVEL_COLORS.error
                    : DRAWER_STYLES.text.muted,
                  opacity: levelFilters.includes('error') ? 1 : 0.5,
                }}
              >
                <Badge
                  badgeContent={logStats.error}
                  color="error"
                  max={999}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 9,
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <ErrorOutlineIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={`Warnings: ${logStats.warn}`}>
              <IconButton
                size="small"
                onClick={() => toggleLevelFilter('warn')}
                sx={{
                  ...ICON_BUTTON_SX,
                  color: levelFilters.includes('warn')
                    ? LEVEL_COLORS.warn
                    : DRAWER_STYLES.text.muted,
                  opacity: levelFilters.includes('warn') ? 1 : 0.5,
                }}
              >
                <Badge
                  badgeContent={logStats.warn}
                  color="warning"
                  max={999}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: 9,
                      minWidth: 16,
                      height: 16,
                    },
                  }}
                >
                  <WarningAmberIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={`Info: ${logStats.info}`}>
              <IconButton
                size="small"
                onClick={() => toggleLevelFilter('info')}
                sx={{
                  ...ICON_BUTTON_SX,
                  color: levelFilters.includes('info')
                    ? LEVEL_COLORS.info
                    : DRAWER_STYLES.text.muted,
                  opacity: levelFilters.includes('info') ? 1 : 0.5,
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Right: Controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
          {/* Line count */}
          <Chip
            size="small"
            label={`${filteredLogs.length.toLocaleString()} / ${logs.length.toLocaleString()}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.08)',
              color: DRAWER_STYLES.text.secondary,
              fontSize: '0.75rem',
              height: 24,
            }}
          />

          {/* Paused indicator */}
          {isPaused && bufferedCount > 0 && (
            <Chip
              size="small"
              label={`+${bufferedCount} buffered`}
              sx={{
                bgcolor: DRAWER_STYLES.status.warning.bg,
                color: DRAWER_STYLES.status.warning.text,
                fontSize: '0.75rem',
                height: 24,
              }}
            />
          )}

          {/* Connected status */}
          {isConnected && (
            <Chip
              size="small"
              label="Connected"
              sx={CONNECTED_CHIP_SX}
              icon={<Box sx={PULSE_DOT_SX} />}
            />
          )}

          <Divider orientation="vertical" flexItem sx={{ ...DIVIDER_SX, mx: 0.5 }} />

          {/* Action buttons */}
          <Tooltip title={isPaused ? 'Resume (Follow)' : 'Pause (Stop following)'}>
            <IconButton
              onClick={isPaused ? handleResume : () => setIsPaused(true)}
              size="small"
              sx={{
                ...ICON_BUTTON_SX,
                color: isPaused
                  ? DRAWER_STYLES.status.warning.text
                  : DRAWER_STYLES.controls.icon,
              }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Scroll to bottom">
            <IconButton onClick={handleScrollToBottom} size="small" sx={ICON_BUTTON_SX}>
              <VerticalAlignBottomIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={wrapLines ? 'Disable wrap' : 'Enable wrap'}>
            <IconButton
              onClick={() => setWrapLines(!wrapLines)}
              size="small"
              sx={{
                ...ICON_BUTTON_SX,
                color: wrapLines
                  ? theme.palette.primary.main
                  : DRAWER_STYLES.controls.icon,
              }}
            >
              <WrapTextIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}>
            <IconButton
              onClick={() => setShowTimestamps(!showTimestamps)}
              size="small"
              sx={{
                ...ICON_BUTTON_SX,
                color: showTimestamps
                  ? theme.palette.primary.main
                  : DRAWER_STYLES.controls.icon,
              }}
            >
              <AccessTimeIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ ...DIVIDER_SX, mx: 0.5 }} />

          <Tooltip title={copySuccess ? 'Copied!' : 'Copy visible logs'}>
            <IconButton
              onClick={handleCopy}
              size="small"
              sx={{
                ...ICON_BUTTON_SX,
                color: copySuccess
                  ? DRAWER_STYLES.status.connected.text
                  : DRAWER_STYLES.controls.icon,
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download logs">
            <IconButton
              onClick={() => downloadLogs(filteredLogs, podName, 'txt')}
              size="small"
              sx={ICON_BUTTON_SX}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear logs">
            <IconButton onClick={handleClear} size="small" sx={ICON_BUTTON_SX}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton
              onClick={(e) => setSettingsAnchor(e.currentTarget)}
              size="small"
              sx={ICON_BUTTON_SX}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ ...DIVIDER_SX, mx: 0.5 }} />

          <Tooltip title={height === '50vh' ? 'Expand' : 'Collapse'}>
            <IconButton onClick={toggleHeight} size="small" sx={ICON_BUTTON_SX}>
              {height === '50vh' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton onClick={handleClose} size="small" sx={ICON_BUTTON_SX}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Settings Popover */}
      <SettingsPopover
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        tailLines={tailLines}
        setTailLines={setTailLines}
        sinceSeconds={sinceSeconds}
        setSinceSeconds={setSinceSeconds}
        isLive={isLive}
        setIsLive={setIsLive}
        showTimestamps={showTimestamps}
        setShowTimestamps={setShowTimestamps}
        wrapLines={wrapLines}
        setWrapLines={setWrapLines}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showPrevious={showPrevious}
        setShowPrevious={setShowPrevious}
      />

      {/* --- LOG BODY --- */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          bgcolor: 'black',
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              right: 10,
              zIndex: 10,
              bgcolor: DRAWER_STYLES.status.error.bg,
              color: DRAWER_STYLES.status.error.text,
              '& .MuiAlert-icon': { color: DRAWER_STYLES.status.error.text },
            }}
          >
            {error}
          </Alert>
        )}

        {filteredLogs.length === 0 && !error && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: DRAWER_STYLES.text.secondary,
            }}
          >
            <Typography variant="body2">
              {isConnected
                ? searchQuery
                  ? 'No logs match your search'
                  : levelFilters.length < 5
                    ? 'No logs match level filters'
                    : 'Waiting for logs...'
                : 'Connecting to pod...'}
            </Typography>
          </Box>
        )}

        {filteredLogs.length > 0 && (
          <List
            listRef={listRef}
            rowCount={filteredLogs.length}
            rowHeight={LINE_HEIGHT}
            rowComponent={LogRow}
            rowProps={{
              logs: filteredLogs,
              showTimestamps,
              wrapLines,
              fontSize,
              highlightTerms,
              containers: containers.map((c) => c.name),
              showContainer: selectedContainer === 'all',
            }}
            style={{ height: '100%', width: '100%', overflowX: 'hidden' }}
          />
        )}
      </Box>
    </Drawer>
  );
}
