import { getSocket } from './socket';

export const initSocket = (): void => {
  const socket = getSocket();
  if (!socket.connected) {
    console.log('🔌 Initializing socket connection...');
    socket.connect();
  }
};

export const closeSocket = (): void => {
  const socket = getSocket();
  if (socket.connected) {
    console.log('🔌 Closing socket connection...');
    socket.disconnect();
  }
};
