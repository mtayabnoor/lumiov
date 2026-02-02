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
import { usePodExec } from "../../hooks/usePodExec";
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
}

function PodExecDialog({
  open,
  onClose,
  namespace,
  podName,
  containers,
  defaultContainer,
}: PodExecDialogProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const hasConnectedRef = useRef(false);

  // Create hook inside component so terminal can be disposed and recreated per dialog lifecycle
  const { terminal, fitAddon, isConnected, error, connect, disconnect } =
    usePodExec();

  // Container selection state
  const [selectedContainer, setSelectedContainer] = useState<string>(
    defaultContainer || containers[0]?.name || "",
  );
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  // Reset connection state and container when dialog opens
  useEffect(() => {
    if (open) {
      hasConnectedRef.current = false;
      setIsTerminalReady(false);
      setSelectedContainer(defaultContainer || containers[0]?.name || "");
    }
  }, [open, defaultContainer, containers]);

  const [retryCount, setRetryCount] = useState(0);

  // Check if terminal is ready
  useEffect(() => {
    if (open && !isTerminalReady) {
      if (terminal && terminalRef.current) {
        setIsTerminalReady(true);
      } else {
        // Poll for terminal readiness - actively force re-render
        const pollTimer = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 50);
        return () => clearTimeout(pollTimer);
      }
    }
  }, [open, terminal, isTerminalReady, retryCount]);

  // Handle terminal mounting and connection
  useEffect(() => {
    if (
      open &&
      isTerminalReady &&
      terminal &&
      terminalRef.current &&
      selectedContainer
    ) {
      // Only open terminal if not already opened
      const isTerminalMounted = terminalRef.current.querySelector(".xterm");
      if (!isTerminalMounted) {
        terminal.open(terminalRef.current);
        console.log("📺 Terminal opened in DOM");
      }

      // Fit and connect after terminal is fully mounted in DOM
      const setupTimer = setTimeout(() => {
        // Fit terminal to container
        if (fitAddon) {
          fitAddon.fit();
        }

        // Connect only once per dialog open
        if (!hasConnectedRef.current && selectedContainer && terminal) {
          console.log("🔌 Connecting to pod exec...", {
            namespace,
            podName,
            container: selectedContainer,
          });
          connect({ namespace, podName, container: selectedContainer });
          hasConnectedRef.current = true;
        }
      }, 100);

      // Handle window resize
      const handleResize = () => {
        if (fitAddon) {
          fitAddon.fit();
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(setupTimer);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [
    open,
    isTerminalReady,
    terminal,
    fitAddon,
    namespace,
    podName,
    selectedContainer,
    connect,
  ]);

  const handleContainerChange = (event: SelectChangeEvent<string>) => {
    const newContainer = event.target.value;
    setSelectedContainer(newContainer);

    // Disconnect current session
    if (isConnected) {
      disconnect();
      hasConnectedRef.current = false;

      // Clear terminal
      if (terminal) {
        terminal.clear();
      }

      // Connect to new container after a brief delay
      setTimeout(() => {
        connect({ namespace, podName, container: newContainer });
        hasConnectedRef.current = true;
      }, 300);
    }
  };

  const handleClose = () => {
    disconnect();
    hasConnectedRef.current = false;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: "80vh",
            maxHeight: "800px",
          },
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: "grey.900", color: "white" }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="h6" component="span">
              Pod Exec: {podName}
            </Typography>
            <Typography
              variant="caption"
              component="div"
              sx={{ color: "grey.400", mt: 0.5 }}
            >
              Namespace: {namespace}
            </Typography>
          </Box>

          {/* Container Selection */}
          {containers.length > 1 && (
            <Box sx={{ minWidth: 200, mr: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "grey.400" }}>Container</InputLabel>
                <Select
                  value={selectedContainer}
                  label="Container"
                  onChange={handleContainerChange}
                  disabled={!open}
                  sx={{
                    color: "white",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.600",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.400",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    ".MuiSvgIcon-root": {
                      color: "grey.400",
                    },
                  }}
                >
                  {containers.map((container) => (
                    <MenuItem key={container.name} value={container.name}>
                      {container.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={1}>
            {isConnected && (
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 500,
                }}
              >
                Connected
              </Typography>
            )}
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                color: "grey.300",
                "&:hover": { color: "white" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          bgcolor: "#1e1e1e",
          overflow: "hidden",
        }}
      >
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          ref={terminalRef}
          sx={{
            width: "100%",
            height: "100%",
            "& .xterm": {
              padding: "10px",
              height: "100%",
            },
            "& .xterm-viewport": {
              overflow: "hidden",
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PodExecDialog;
