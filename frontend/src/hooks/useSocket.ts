import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../services/socket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../interfaces/socket";

export const useSocket = () => {
  // Lazy initialization to avoid effect
  const [socket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(() => getSocket());

  // Effect removed as socket is static singleton
  /*
  useEffect(() => { ... }, []);
  */

  return socket;
};
