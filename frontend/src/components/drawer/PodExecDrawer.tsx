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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "@xterm/xterm/css/xterm.css";

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
  // --- State ---
  const [selectedContainer, setSelectedContainer] = useState(
    defaultContainer || containers[0]?.name || "",
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState("50vh");

  // --- Refs (Mutable instances that don't trigger re-renders) ---
  const termRef = useRef<Terminal | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // 1. Reset UI state when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedContainer(defaultContainer || containers[0]?.name || "");
      setError(null);
      setIsConnected(false);
    }
  }, [open, defaultContainer, containers]);

  // 2. Cleanup Logic (Stops processes & clears memory)
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

  // 3. Initialize Terminal (Callback Ref Pattern)
  // React calls this function automatically when the <div> mounts.
  const initTerminal = useCallback(
    (containerDiv: HTMLDivElement | null) => {
      // If div is unmounted, run cleanup
      if (!containerDiv) {
        cleanupSession();
        return;
      }

      // Prevent duplicate initialization
      if (termRef.current || !socket) return;

      console.log("🚀 Terminal DOM Ready. Initializing...");

      // A. Setup XTerm
      const term = new Terminal({
        cursorBlink: true,
        theme: { background: "#1e1e1e", foreground: "#ffffff" },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        cols: 80, // Default width
        rows: 24, // Default height
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerDiv);

      termRef.current = term;

      // B. Setup Socket Listeners
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

      // C. Start Backend Session
      socket.emit("exec:start", {
        namespace,
        podName,
        container: selectedContainer,
      });

      // Force immediate resize to wake up the backend PTY
      socket.emit("exec:resize", { cols: 80, rows: 24 });

      // D. Setup Auto-Resize Observer
      const observer = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          if (term.cols > 0 && term.rows > 0) {
            socket.emit("exec:resize", { cols: term.cols, rows: term.rows });
          }
        } catch (e) {
          // Ignore resize errors if hidden
        }
      });

      observer.observe(containerDiv);
      observerRef.current = observer;

      // E. Initial Fit
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {}
      }, 50);
    },
    [socket, namespace, podName, selectedContainer, cleanupSession],
  );

  // 4. Handle Close
  const handleClose = () => {
    cleanupSession();
    onClose();
  };

  const toggleHeight = () => {
    setHeight((h) => (h === "50vh" ? "85vh" : "50vh"));
  };

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
          },
        },
      }}
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "#2d2d2d",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #444",
          flexShrink: 0,
        }}
      >
        {/* Left: Pod Info */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* SECTION 1: Pod Context */}
          <Box display="flex" flexDirection="column">
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "white",
                lineHeight: 1.2,
              }}
            >
              {podName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "grey.500",
                fontFamily: "monospace", // Makes namespace look technical
                fontSize: "0.7rem",
              }}
            >
              {namespace}
            </Typography>
          </Box>

          {/* SECTION 2: Container Selector (Only shows if multiple) */}
          {containers.length > 1 && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  bgcolor: "grey.700",
                  mx: 1,
                  height: 24,
                  alignSelf: "center",
                }}
              />

              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="caption"
                  sx={{ color: "grey.500", fontWeight: 500 }}
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
                      height: 32, // Sleek, compact height
                      color: "white",
                      fontSize: "0.875rem",
                      bgcolor: "rgba(255,255,255,0.05)", // Subtle background
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "grey.700", // Darker, subtler border
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "grey.500",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                      ".MuiSvgIcon-root": {
                        color: "grey.400",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: "#2d2d2d",
                          color: "white",
                          "& .MuiMenuItem-root": {
                            fontSize: "0.875rem",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                            "&.Mui-selected": {
                              bgcolor: "rgba(33, 150, 243, 0.2)",
                            }, // Blue tint for selected
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
        </Box>

        {/* Right: Controls */}
        <Box display="flex" alignItems="center" gap={1}>
          {isConnected && (
            <Typography
              variant="caption"
              sx={{
                color: "#4caf50",
                border: "1px solid #4caf50",
                px: 1,
                borderRadius: 1,
              }}
            >
              Connected
            </Typography>
          )}
          <IconButton
            onClick={toggleHeight}
            size="small"
            sx={{ color: "grey.300" }}
          >
            {height === "50vh" ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: "grey.300" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* --- TERMINAL BODY --- */}
      <Box sx={{ flex: 1, position: "relative", p: 1, minHeight: 0 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}
          >
            {error}
          </Alert>
        )}

        {/* Only render div if open. 'ref' triggers initTerminal automatically. */}
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
