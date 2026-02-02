import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface Container {
  name: string;
}

interface PodExecDialogProps {
  open: boolean;
  onClose: () => void;
  namespace: string;
  podName: string;
  containers: Container[];
  defaultContainer?: string;
  socket: Socket | null;
}

function PodExecDialog({
  open,
  onClose,
  namespace,
  podName,
  containers,
  defaultContainer,
  socket,
}: PodExecDialogProps) {
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Store instances to survive re-renders
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);

  const [selectedContainer, setSelectedContainer] = useState<string>(
    defaultContainer || containers[0]?.name || "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSelectedContainer(defaultContainer || containers[0]?.name || "");
      setError(null);
      setIsConnected(false);
    }
  }, [open, defaultContainer, containers]);

  useEffect(() => {
    if (!open || !socket || !terminalContainerRef.current) return;

    let animationFrameId: number;
    const container = terminalContainerRef.current;

    // --- CLEANUP FUNCTION ---
    const cleanup = () => {
      cancelAnimationFrame(animationFrameId);

      socket.emit("exec:stop");
      socket.off("exec:data");
      socket.off("exec:error");

      if (termInstance.current) {
        termInstance.current.dispose();
        termInstance.current = null;
      }
      setIsConnected(false);
    };

    // --- INITIALIZATION ---
    const initTerminal = () => {
      // prevent double init
      if (termInstance.current) return;

      console.log("🚀 Container is ready (Height > 0). Initializing XTerm...");

      const term = new Terminal({
        cursorBlink: true,
        theme: { background: "#1e1e1e", foreground: "#ffffff" },
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      // Open in DOM
      term.open(container);
      termInstance.current = term;
      fitAddonInstance.current = fitAddon;

      // Fit immediately
      try {
        fitAddon.fit();
      } catch (e) {}

      // Socket Listeners
      const handleData = (data: string) => {
        term.write(data);
        setIsConnected(true);
      };

      const handleError = (err: any) => {
        setError(typeof err === "string" ? err : "Unknown socket error");
        term.writeln(`\r\n\x1b[31mError: ${err}\x1b[0m`);
      };

      socket.on("exec:data", handleData);
      socket.on("exec:error", handleError);

      term.onData((data) => {
        socket.emit("exec:input", data);
      });

      // Start Session
      socket.emit("exec:start", {
        namespace,
        podName,
        container: selectedContainer,
      });

      // Sync Size
      if (term.cols > 0 && term.rows > 0) {
        socket.emit("exec:resize", { cols: term.cols, rows: term.rows });
      }

      // Add simple window resize listener as backup
      window.addEventListener("resize", () => {
        fitAddon.fit();
        socket.emit("exec:resize", { cols: term.cols, rows: term.rows });
      });
    };

    // --- THE FIX: POLLING LOOP ---
    // We loop every frame until the Dialog animation finishes
    // and the container actually has pixels.
    const waitForDimensions = () => {
      if (!container) return;

      // CHECK: Is the div actually visible and has size?
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        initTerminal(); // ✅ Yes! Launch it.
      } else {
        // ❌ No, still animating (height=0). Wait for next frame.
        animationFrameId = requestAnimationFrame(waitForDimensions);
      }
    };

    // Start the loop
    waitForDimensions();

    return cleanup;
  }, [open, socket, namespace, podName, selectedContainer]);

  const handleContainerChange = (event: SelectChangeEvent<string>) => {
    setSelectedContainer(event.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      keepMounted={false}
      slotProps={{
        paper: {
          sx: {
            height: "80vh",
            maxHeight: "800px",
            bgcolor: "#1e1e1e",
            display: "flex", // Flex column layout
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ m: 0, p: 2, bgcolor: "#2d2d2d", color: "white", flexShrink: 0 }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="h6" component="span">
              Pod Exec: {podName}
            </Typography>
            <Typography
              variant="caption"
              component="div"
              sx={{ color: "grey.400" }}
            >
              {namespace}
            </Typography>
          </Box>
          {containers.length > 1 && (
            <Box sx={{ minWidth: 200, mr: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "grey.400" }}>Container</InputLabel>
                <Select
                  value={selectedContainer}
                  label="Container"
                  onChange={handleContainerChange}
                  sx={{
                    color: "white",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.600",
                    },
                    ".MuiSvgIcon-root": { color: "grey.400" },
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
          )}
          <Box display="flex" gap={1}>
            {isConnected && (
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                Connected
              </Typography>
            )}
            <IconButton onClick={onClose} sx={{ color: "grey.300" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          bgcolor: "#1e1e1e",
          flex: 1, // Grow to fill remaining space
          minHeight: 0, // Fix for Firefox flex scrolling
          position: "relative", // Context for child
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
          >
            {error}
          </Alert>
        )}

        {/* TERMINAL CONTAINER */}
        <Box
          ref={terminalContainerRef}
          sx={{
            position: "absolute", // Force fill
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            "& .xterm": { padding: "10px" },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PodExecDialog;
