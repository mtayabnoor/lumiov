import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Socket } from "socket.io-client";
import {
  List,
  type RowComponentProps,
  type ListImperativeAPI,
} from "react-window";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DownloadIcon from "@mui/icons-material/Download";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import ArticleIcon from "@mui/icons-material/Article";

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
} from "./drawerStyles";

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
}

interface LogRowProps {
  logs: LogLine[];
}

// --- Constants ---
const LINE_HEIGHT = 22;
const MAX_LINES = 10000;

// --- Helpers ---
const parseLogLine = (line: string, id: number): LogLine => {
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s*/);
  if (timestampMatch) {
    return {
      id,
      timestamp: timestampMatch[1],
      content: line.slice(timestampMatch[0].length),
      raw: line,
    };
  }
  return { id, timestamp: "", content: line, raw: line };
};

const downloadLogs = (logs: LogLine[], podName: string) => {
  const content = logs.map((l) => l.raw).join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${podName}-logs.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Row Component ---
function LogRow({ index, style, logs }: RowComponentProps<LogRowProps>) {
  const log = logs[index];
  if (!log) return null;

  const isError = log.content.toLowerCase().includes("error");
  const isWarn = log.content.toLowerCase().includes("warn");

  return (
    <Box
      style={style}
      sx={{
        display: "flex",
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: "12px",
        lineHeight: `${LINE_HEIGHT}px`,
        px: 1.5,
        boxSizing: "border-box",
        "&:hover": {
          bgcolor: "rgba(255, 255, 255, 0.02)",
        },
        borderLeft: isError
          ? `2px solid ${DRAWER_STYLES.status.error.text}`
          : isWarn
            ? `2px solid ${DRAWER_STYLES.status.warning.text}`
            : "2px solid transparent",
      }}
    >
      {/* Line number */}
      <Typography
        component="span"
        sx={{
          color: DRAWER_STYLES.text.muted,
          minWidth: 50,
          textAlign: "right",
          mr: 2,
          userSelect: "none",
          fontSize: "inherit",
          fontFamily: "inherit",
        }}
      >
        {log.id + 1}
      </Typography>

      {/* Timestamp */}
      {log.timestamp && (
        <Typography
          component="span"
          sx={{
            color: DRAWER_STYLES.status.connected.text,
            minWidth: 200,
            mr: 2,
            fontSize: "inherit",
            fontFamily: "inherit",
          }}
        >
          {log.timestamp}
        </Typography>
      )}

      {/* Content */}
      <Typography
        component="span"
        sx={{
          color: "#e6e6e6",
          flex: 1,
          whiteSpace: "pre",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: "inherit",
          fontFamily: "inherit",
        }}
      >
        {log.content}
      </Typography>
    </Box>
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
    defaultContainer || containers[0]?.name || "",
  );
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState("50vh");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Refs ---
  const lineIdRef = useRef(0);
  const pausedLogsRef = useRef<LogLine[]>([]);
  const isPausedRef = useRef(false); // Ref to avoid stale closure in socket handler

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.content.toLowerCase().includes(query) ||
        log.timestamp.toLowerCase().includes(query),
    );
  }, [logs, searchQuery]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedContainer(defaultContainer || containers[0]?.name || "");
      setError(null);
      setIsConnected(false);
      setLogs([]);
      setIsPaused(false);
      setSearchQuery("");
      lineIdRef.current = 0;
      pausedLogsRef.current = [];
    }
  }, [open, defaultContainer, containers]);

  // Sync isPausedRef with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Subscribe to logs - NOTE: isPaused is NOT in deps to avoid re-subscribing
  useEffect(() => {
    if (!open || !socket || !selectedContainer) return;

    console.log(`📜 [Logs] Subscribing: ${podName}/${selectedContainer}`);

    const handleLogData = (data: string) => {
      const newLines = data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => parseLogLine(line, lineIdRef.current++));

      // Use ref to get current paused state (avoids stale closure)
      if (isPausedRef.current) {
        pausedLogsRef.current = [...pausedLogsRef.current, ...newLines];
        return;
      }

      setLogs((prev) => {
        const updated = [...prev, ...newLines];
        return updated.length > MAX_LINES ? updated.slice(-MAX_LINES) : updated;
      });

      setIsConnected(true);
    };

    const handleLogError = (err: string) => {
      console.error("❌ [Logs] Error:", err);
      setError(typeof err === "string" ? err : "Unknown error");
    };

    socket.on("logs:data", handleLogData);
    socket.on("logs:error", handleLogError);

    socket.emit("logs:subscribe", {
      namespace,
      podName,
      containerName: selectedContainer,
    });

    return () => {
      console.log(`📜 [Logs] Unsubscribing: ${podName}/${selectedContainer}`);
      socket.emit("logs:unsubscribe");
      socket.off("logs:data", handleLogData);
      socket.off("logs:error", handleLogError);
    };
  }, [open, socket, namespace, podName, selectedContainer]); // isPaused NOT in deps

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({
        index: filteredLogs.length - 1,
        align: "end",
      });
    }
  }, [filteredLogs.length, isPaused]);

  const handleResume = useCallback(() => {
    setLogs((prev) => [...prev, ...pausedLogsRef.current].slice(-MAX_LINES));
    pausedLogsRef.current = [];
    setIsPaused(false);
  }, []);

  const handleClear = useCallback(() => {
    setLogs([]);
    pausedLogsRef.current = [];
    lineIdRef.current = 0;
  }, []);

  const handleScrollToBottom = useCallback(() => {
    if (listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({
        index: filteredLogs.length - 1,
        align: "end",
      });
    }
  }, [filteredLogs.length]);

  const handleClose = useCallback(() => {
    // Emit unsubscribe before closing to ensure cleanup
    if (socket) {
      socket.emit("logs:unsubscribe");
    }
    setLogs([]);
    lineIdRef.current = 0;
    pausedLogsRef.current = [];
    onClose();
  }, [onClose, socket]);

  const toggleHeight = () => setHeight((h) => (h === "50vh" ? "85vh" : "50vh"));

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
            <ArticleIcon
              sx={{ color: theme.palette.primary.main, fontSize: 20 }}
            />
            <Box display="flex" flexDirection="column">
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: DRAWER_STYLES.text.primary,
                  lineHeight: 1.2,
                }}
              >
                {podName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: DRAWER_STYLES.text.muted,
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
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
                <Typography
                  variant="caption"
                  sx={{ color: DRAWER_STYLES.text.secondary, fontWeight: 500 }}
                >
                  Container:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    displayEmpty
                    variant="outlined"
                    sx={getSelectSx(theme.palette.primary.main)}
                    MenuProps={getMenuProps()}
                  >
                    {containers.map((c) => (
                      <MenuItem key={c.name} value={c.name}>
                        {c.name}
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
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: DRAWER_STYLES.controls.icon, fontSize: 18 }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: 200,
              "& .MuiOutlinedInput-root": {
                height: 32,
                color: DRAWER_STYLES.text.primary,
                fontSize: "0.875rem",
                bgcolor: DRAWER_STYLES.controls.inputBg,
                "& fieldset": {
                  borderColor: DRAWER_STYLES.controls.inputBorder,
                },
                "&:hover fieldset": {
                  borderColor: DRAWER_STYLES.controls.inputBorderHover,
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Box>

        {/* Right: Controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
          {/* Line count */}
          <Chip
            size="small"
            label={`${filteredLogs.length.toLocaleString()} lines`}
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              color: DRAWER_STYLES.text.secondary,
              fontSize: "0.75rem",
              height: 24,
            }}
          />

          {/* Paused indicator */}
          {isPaused && pausedLogsRef.current.length > 0 && (
            <Chip
              size="small"
              label={`+${pausedLogsRef.current.length} buffered`}
              sx={{
                bgcolor: DRAWER_STYLES.status.warning.bg,
                color: DRAWER_STYLES.status.warning.text,
                fontSize: "0.75rem",
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

          <Divider
            orientation="vertical"
            flexItem
            sx={{ ...DIVIDER_SX, mx: 0.5 }}
          />

          {/* Action buttons */}
          <Tooltip title={isPaused ? "Resume" : "Pause"}>
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
            <IconButton
              onClick={handleScrollToBottom}
              size="small"
              sx={ICON_BUTTON_SX}
            >
              <VerticalAlignBottomIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear logs">
            <IconButton onClick={handleClear} size="small" sx={ICON_BUTTON_SX}>
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download logs">
            <IconButton
              onClick={() => downloadLogs(logs, podName)}
              size="small"
              sx={ICON_BUTTON_SX}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ ...DIVIDER_SX, mx: 0.5 }}
          />

          <Tooltip title={height === "50vh" ? "Expand" : "Collapse"}>
            <IconButton onClick={toggleHeight} size="small" sx={ICON_BUTTON_SX}>
              {height === "50vh" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton onClick={handleClose} size="small" sx={ICON_BUTTON_SX}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* --- LOG BODY --- */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          minHeight: 0,
          bgcolor: DRAWER_STYLES.paper.bodyBg,
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              right: 10,
              zIndex: 10,
              bgcolor: DRAWER_STYLES.status.error.bg,
              color: DRAWER_STYLES.status.error.text,
              "& .MuiAlert-icon": { color: DRAWER_STYLES.status.error.text },
            }}
          >
            {error}
          </Alert>
        )}

        {filteredLogs.length === 0 && !error && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: DRAWER_STYLES.text.secondary,
            }}
          >
            <Typography variant="body2">
              {isConnected
                ? searchQuery
                  ? "No logs match your search"
                  : "Waiting for logs..."
                : "Connecting to pod..."}
            </Typography>
          </Box>
        )}

        {filteredLogs.length > 0 && (
          <List
            listRef={listRef}
            rowCount={filteredLogs.length}
            rowHeight={LINE_HEIGHT}
            rowComponent={LogRow}
            rowProps={{ logs: filteredLogs }}
            style={{ height: "100%", width: "100%", overflowX: "hidden" }}
          />
        )}
      </Box>
    </Drawer>
  );
}
