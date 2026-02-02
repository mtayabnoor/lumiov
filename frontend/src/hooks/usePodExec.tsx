import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import {
  SocketEvent,
  ExecParams,
  ServerToClientEvents,
  ClientToServerEvents,
} from "../interfaces/socket";

interface UsePodExecReturn {
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
  isConnected: boolean;
  error: string | null;
  connect: (params: ExecParams) => void;
  disconnect: () => void;
}

const SOCKET_URL = "http://localhost:3030/api/exec";

export const usePodExec = (): UsePodExecReturn => {
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const isConnectingRef = useRef(false);

  // Initialize terminal once on mount
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#f0f0f0",
      },
      rows: 30,
      cols: 100,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    setTerminal(term);
    setFitAddon(fit);

    return () => {
      term.dispose();
    };
  }, []);

  // Disconnect function - wrapped in useCallback
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
    setError(null);
  }, []);

  // Connect function - wrapped in useCallback
  const connect = useCallback(
    (params: ExecParams) => {
      if (!terminal) {
        console.error("Terminal not initialized");
        return;
      }

      // FIX: Prevent double connections
      if (isConnectingRef.current || socketRef.current?.connected) {
        console.log(
          "Already connecting or connected, ignoring duplicate request",
        );
        return;
      }

      isConnectingRef.current = true;
      terminal.clear();

      // Create socket connection
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: false,
      });

      socketRef.current = socket;

      // Connection established
      socket.on("connect", () => {
        console.log("✅ Exec socket connected");
        setIsConnected(true);
        setError(null);

        // Emit exec request
        socket.emit(SocketEvent.EXEC, params);
      });

      // Handle incoming data from pod
      socket.on(SocketEvent.EXEC_DATA, (data: string) => {
        terminal.write(data);
      });

      // Handle errors
      socket.on(SocketEvent.EXEC_ERROR, (payload: { message: string }) => {
        setError(payload.message);
        terminal.write(`\r\n\x1b[31mError: ${payload.message}\x1b[0m\r\n`);
      });

      // Disconnection
      socket.on("disconnect", () => {
        console.log("❌ Exec socket disconnected");
        isConnectingRef.current = false;
        setIsConnected(false);
        terminal.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
      });

      // Connection errors
      socket.on("connect_error", (err) => {
        console.error("⚠️ Exec socket error:", err);
        setError(err.message);
        isConnectingRef.current = false;
        setIsConnected(false);
      });

      // FIX: Set up terminal input handler ONCE per connection
      // Store the disposable so we can clean it up
      const disposable = terminal.onData((data) => {
        if (socket.connected) {
          socket.emit(SocketEvent.EXEC_INPUT, data);
        }
      });

      // Set up resize handler
      const resizeDisposable = terminal.onResize(({ rows, cols }) => {
        if (socket.connected) {
          socket.emit(SocketEvent.EXEC_RESIZE, { rows, cols });
        }
      });

      // Clean up disposables when socket disconnects
      socket.on("disconnect", () => {
        disposable.dispose();
        resizeDisposable.dispose();
      });
    },
    [terminal],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    terminal,
    fitAddon,
    isConnected,
    error,
    connect,
    disconnect,
  };
};
