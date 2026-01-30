import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { SocketEvent, WatchResourcePayload } from "../../interfaces/socket";
import { Deployment } from "../../interfaces/deployment";

export const useDeployment = () => {
  const socket = useSocket();
  const [deployments, setDeployments] = useState<
    WatchResourcePayload<Deployment>[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // 1. Subscribe to 'data' events
    const handleData = (payload: WatchResourcePayload<Deployment>) => {
      if (payload.resource !== "deployments") return;

      setLoading(false);

      if (payload.action === "ADDED") {
        setDeployments((prev) => {
          // Avoid duplicates
          if (
            prev.find(
              (p) => p.object.metadata.uid === payload.object.metadata.uid,
            )
          )
            return prev;
          return [...prev, payload];
        });
      } else if (payload.action === "MODIFIED") {
        setDeployments((prev) =>
          prev.map((p) =>
            p.object.metadata.uid === payload.object.metadata.uid ? payload : p,
          ),
        );
      } else if (payload.action === "DELETED") {
        setDeployments((prev) =>
          prev.filter(
            (p) => p.object.metadata.uid !== payload.object.metadata.uid,
          ),
        );
      }
    };

    const handleError = (payload: { message: string }) => {
      setError(payload.message);
      setLoading(false);
    };

    socket.on(SocketEvent.DATA, handleData);
    socket.on(SocketEvent.ERROR, handleError);

    // 2. Emit 'watch' event for pods
    // Wait for connection to be open? The socket might be connecting.
    if (socket.connected) {
      socket.emit(SocketEvent.WATCH, "deployments");
    } else {
      socket.on("connect", () => {
        socket.emit(SocketEvent.WATCH, "deployments");
      });
    }

    // We strictly should clean up listeners, but if we navigate away
    // we might want to stop the watch? The backend logic says
    // "Switching context: Stopping previous watch..." so if we emit another watch
    // it will stop this one.
    // Ideally we should emit 'unwatch' if we leave, but backend doesn't support it explicitely
    // except by disconnect or new watch.
    // For now we just remove listeners.

    return () => {
      socket.off(SocketEvent.DATA, handleData);
      socket.off(SocketEvent.ERROR, handleError);
    };
  }, [socket]);

  return { deployments, error, loading };
};
