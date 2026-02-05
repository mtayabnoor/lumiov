import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
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
  Chip,
  Tooltip,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TerminalIcon from "@mui/icons-material/Terminal";
import "@xterm/xterm/css/xterm.css";

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

interface PodExecDrawerProps {
  open: boolean;
  onClose: () => void;
  namespace: string;
  podName: string;
  containers: Container[];
  defaultContainer?: string;
  socket: Socket | null;
}

export default function PodExecDrawer({
  open,
  onClose,
  namespace,
  podName,
  containers,
  defaultContainer,
  socket,
}: PodExecDrawerProps) {
  const theme = useTheme();

  // --- State ---
  const [selectedContainer, setSelectedContainer] = useState(
    defaultContainer || containers[0]?.name || "",
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState("50vh");

  // --- Refs ---
  const termRef = useRef<Terminal | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Reset UI state when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedContainer(defaultContainer || containers[0]?.name || "");
      setError(null);
      setIsConnected(false);
    }
  }, [open, defaultContainer, containers]);

  // Cleanup Logic
  const cleanupSession = useCallback(() => {
    if (socket) {
      socket.emit("exec:stop");
      socket.off("exec:data");
      socket.off("exec:error");
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }

    setIsConnected(false);
  }, [socket]);

  // Initialize Terminal
  const initTerminal = useCallback(
    (containerDiv: HTMLDivElement | null) => {
      if (!containerDiv) {
        cleanupSession();
        return;
      }

      if (termRef.current || !socket) return;

      console.log("🚀 Terminal DOM Ready. Initializing...");

      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: DRAWER_STYLES.paper.bodyBg,
          foreground: "#e6e6e6",
          cursor: theme.palette.primary.main,
        },
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: 13,
        cols: 80,
        rows: 24,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerDiv);
      termRef.current = term;

      // Socket Listeners
      socket.on("exec:data", (data) => {
        term.write(data);
        setIsConnected(true);
      });

      socket.on("exec:error", (err) => {
        const msg = typeof err === "string" ? err : "Unknown Error";
        term.writeln(`\r\n\x1b[31mError: ${msg}\x1b[0m`);
        setError(msg);
      });

      term.onData((data) => socket.emit("exec:input", data));

      // Start Backend Session
      socket.emit("exec:start", {
        namespace,
        podName,
        container: selectedContainer,
      });

      socket.emit("exec:resize", { cols: 80, rows: 24 });

      // Auto-Resize Observer
      const observer = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          if (term.cols > 0 && term.rows > 0) {
            socket.emit("exec:resize", { cols: term.cols, rows: term.rows });
          }
        } catch (e) {
          /* ignore */
        }
      });

      observer.observe(containerDiv);
      observerRef.current = observer;

      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          /* ignore */
        }
      }, 50);
    },
    [socket, namespace, podName, selectedContainer, cleanupSession, theme],
  );

  const handleClose = () => {
    cleanupSession();
    onClose();
  };

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
            <TerminalIcon
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
        </Box>

        {/* Right: Controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
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

      {/* --- TERMINAL BODY --- */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          p: 1,
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

        {open && (
          <div
            ref={initTerminal}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
          />
        )}
      </Box>
    </Drawer>
  );
}
