import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';
import type { ClientToServerEvents, ServerToClientEvents } from '../interfaces/socket';

export function useSocket() {
  const [socket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
    () => getSocket(),
  );

  return socket;
}
