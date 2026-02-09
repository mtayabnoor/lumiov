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
  // We keep track of the instance to be able to dispose of it later
  const termRef = useRef<Terminal | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // --- Cleanup Logic ---
  // This function destroys the current terminal session
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

    fitAddonRef.current = null;
    setIsConnected(false);
  }, [socket]);

  // --- The Core Logic (Callback Ref) ---
  // We use useCallback so this function stays stable.
  // If we didn't use useCallback, React would think it's a new function every render,
  // detach the ref, and re-run this endlessly (The Infinite Loop issue you had).
  const initTerminal = useCallback(
    (containerDiv: HTMLDivElement | null) => {
      // 1. If containerDiv is null, the component is unmounting (or switching containers).
      //    We should cleanup.
      if (!containerDiv) {
        cleanupSession();
        return;
      }

      // 2. Guard: If socket is missing, we can't do anything.
      if (!socket) return;

      console.log("🚀 Initializing Terminal for:", selectedContainer);
      setError(null);

      // 3. Instantiate Xterm
      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: DRAWER_STYLES.paper.bodyBg,
          foreground: "#e6e6e6",
          cursor: theme.palette.primary.main,
        },
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: 13,
        cols: 80, // Default fallback
        rows: 24, // Default fallback
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      // Open terminal in the DOM element
      term.open(containerDiv);

      // Save refs
      termRef.current = term;
      fitAddonRef.current = fitAddon;

      // 4. Socket Listeners
      socket.on("exec:data", (data) => {
        term.write(data);
        setIsConnected(true);
      });

      socket.on("exec:error", (err) => {
        const msg = typeof err === "string" ? err : "Unknown Error";
        term.writeln(`\r\n\x1b[31mError: ${msg}\x1b[0m`);
        setError(msg);
      });

      // Handle user typing
      term.onData((data) => socket.emit("exec:input", data));

      // 5. Start Session
      socket.emit("exec:start", {
        namespace,
        podName,
        container: selectedContainer,
      });

      // --- CRITICAL FIX: The Delay ---
      // We wait 300ms for the Drawer animation to finish before fitting.
      // Without this, fit() calculates 0x0 size and the terminal breaks.
      setTimeout(() => {
        try {
          fitAddon.fit();
          if (term.cols > 0 && term.rows > 0) {
            socket.emit("exec:resize", { cols: term.cols, rows: term.rows });
          }
        } catch (e) {
          console.warn("Fit failed", e);
        }
      }, 300); // 300ms covers most standard MUI transitions

      // 6. Resize Observer (Handles window resizing)
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
    },
    // Dependencies: If any of these change, React will call cleanup() (node=null)
    // and then call initTerminal() (node=div) again.
    [socket, namespace, podName, selectedContainer, theme.palette.primary.main],
  );

  const handleClose = () => {
    cleanupSession();
    onClose();
  };

  const toggleHeight = () => setHeight((h) => (h === "50vh" ? "85vh" : "50vh"));

  // Re-fit when height changes (user clicks expand)
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {}
      }, 300);
    }
  }, [height]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: { sx: getDrawerPaperSx(height) },
      }}
    >
      {/* HEADER */}
      <Box sx={DRAWER_HEADER_SX}>
        <Box display="flex" alignItems="center" gap={2}>
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

      {/* TERMINAL BODY */}
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

        {/* The `ref={initTerminal}` here is a "Callback Ref".
            When this div is mounted, React calls `initTerminal(div)`.
            When it updates or unmounts, React calls `initTerminal(null)`.
            We handle the cleanup inside that function.
        */}
        <div
          ref={initTerminal}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
        />
      </Box>
    </Drawer>
  );
}
