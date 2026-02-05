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
const LOG_BG = "#0d1117";
const LOG_HEADER_BG = "#161b22";

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

// --- Row Component for react-window v2 ---
function LogRow({ index, style, logs }: RowComponentProps<LogRowProps>) {
  const log = logs[index];
  if (!log) return null;

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
          bgcolor: "rgba(255, 255, 255, 0.03)",
        },
        borderLeft: log.content.toLowerCase().includes("error")
          ? "2px solid #f85149"
          : log.content.toLowerCase().includes("warn")
            ? "2px solid #d29922"
            : "2px solid transparent",
      }}
    >
      {/* Line number */}
      <Typography
        component="span"
        sx={{
          color: "#484f58",
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
            color: "#7ee787",
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
          color: "#e6edf3",
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

  // Subscribe to logs
  useEffect(() => {
    if (!open || !socket || !selectedContainer) return;

    console.log(`📜 [Logs] Subscribing: ${podName}/${selectedContainer}`);

    const handleLogData = (data: string) => {
      const newLines = data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => parseLogLine(line, lineIdRef.current++));

      if (isPaused) {
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
      socket.emit("logs:unsubscribe");
      socket.off("logs:data", handleLogData);
      socket.off("logs:error", handleLogError);
    };
  }, [open, socket, namespace, podName, selectedContainer, isPaused]);

  // Auto-scroll
  useEffect(() => {
    if (!isPaused && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({
        index: filteredLogs.length - 1,
        align: "end",
      });
    }
  }, [filteredLogs.length, isPaused, listRef]);

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
  }, [filteredLogs.length, listRef]);

  const handleClose = useCallback(() => {
    setLogs([]);
    onClose();
  }, [onClose]);

  const toggleHeight = () => setHeight((h) => (h === "50vh" ? "85vh" : "50vh"));

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            height,
            bgcolor: "#1e1e1e",
            color: "white",
            display: "flex",
            flexDirection: "column",
            transition: "height 0.3s ease-in-out",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        },
      }}
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: LOG_HEADER_BG,
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #30363d",
          flexShrink: 0,
        }}
      >
        {/* Left: Pod Info */}
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" flexDirection="column">
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "white", lineHeight: 1.2 }}
            >
              📜 {podName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#8b949e",
                fontFamily: "monospace",
                fontSize: "0.7rem",
              }}
            >
              {namespace}
            </Typography>
          </Box>

          {containers.length > 1 && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  bgcolor: "#30363d",
                  mx: 1,
                  height: 24,
                  alignSelf: "center",
                }}
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="caption"
                  sx={{ color: "#8b949e", fontWeight: 500 }}
                >
                  Container:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    displayEmpty
                    variant="outlined"
                    sx={{
                      height: 32,
                      color: "white",
                      fontSize: "0.875rem",
                      bgcolor: "rgba(255,255,255,0.05)",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#30363d",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#8b949e",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                      ".MuiSvgIcon-root": { color: "#8b949e" },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: LOG_HEADER_BG,
                          color: "white",
                          "& .MuiMenuItem-root": {
                            fontSize: "0.875rem",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                            "&.Mui-selected": {
                              bgcolor: "rgba(56, 139, 253, 0.15)",
                            },
                          },
                        },
                      },
                    }}
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

          <Divider
            orientation="vertical"
            flexItem
            sx={{ bgcolor: "#30363d", mx: 1, height: 24, alignSelf: "center" }}
          />

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
                    <SearchIcon sx={{ color: "#8b949e", fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: 200,
              "& .MuiOutlinedInput-root": {
                height: 32,
                color: "white",
                fontSize: "0.875rem",
                bgcolor: "rgba(255,255,255,0.05)",
                "& fieldset": { borderColor: "#30363d" },
                "&:hover fieldset": { borderColor: "#8b949e" },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Box>

        {/* Right: Controls */}
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            size="small"
            label={`${filteredLogs.length.toLocaleString()} lines`}
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              color: "#8b949e",
              fontSize: "0.75rem",
              height: 24,
            }}
          />

          {isPaused && pausedLogsRef.current.length > 0 && (
            <Chip
              size="small"
              label={`+${pausedLogsRef.current.length} buffered`}
              sx={{
                bgcolor: "rgba(210, 153, 34, 0.2)",
                color: "#d29922",
                fontSize: "0.75rem",
                height: 24,
              }}
            />
          )}

          {isConnected && (
            <Chip
              size="small"
              label="Connected"
              sx={{
                bgcolor: "rgba(46, 160, 67, 0.2)",
                color: "#3fb950",
                fontSize: "0.75rem",
                height: 24,
              }}
              icon={
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#3fb950",
                    ml: 1,
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                    },
                  }}
                />
              }
            />
          )}

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              bgcolor: "#30363d",
              mx: 0.5,
              height: 24,
              alignSelf: "center",
            }}
          />

          <Tooltip title={isPaused ? "Resume" : "Pause"}>
            <IconButton
              onClick={isPaused ? handleResume : () => setIsPaused(true)}
              size="small"
              sx={{ color: isPaused ? "#d29922" : "#8b949e" }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Scroll to bottom">
            <IconButton
              onClick={handleScrollToBottom}
              size="small"
              sx={{ color: "#8b949e" }}
            >
              <VerticalAlignBottomIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear logs">
            <IconButton
              onClick={handleClear}
              size="small"
              sx={{ color: "#8b949e" }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download logs">
            <IconButton
              onClick={() => downloadLogs(logs, podName)}
              size="small"
              sx={{ color: "#8b949e" }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              bgcolor: "#30363d",
              mx: 0.5,
              height: 24,
              alignSelf: "center",
            }}
          />

          <IconButton
            onClick={toggleHeight}
            size="small"
            sx={{ color: "#8b949e" }}
          >
            {height === "50vh" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: "#8b949e" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* --- LOG BODY --- */}
      <Box
        sx={{ flex: 1, position: "relative", minHeight: 0, bgcolor: LOG_BG }}
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
              bgcolor: "rgba(248, 81, 73, 0.15)",
              color: "#f85149",
              "& .MuiAlert-icon": { color: "#f85149" },
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
              color: "#8b949e",
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
