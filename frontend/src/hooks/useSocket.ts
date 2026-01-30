import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../services/socket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../interfaces/socket";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    // Get the singleton instance
    const socketInstance = getSocket();
    setSocket(socketInstance);

    // Cleanup not needed here as we want the socket to persist,
    // but individual components should unsubscribe from their specific events.
  }, []);

  return socket;
};
