import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import {
  SocketEvent,
  K8sEventPayload,
  K8sListPayload,
} from "../interfaces/socket";
import { Pod } from "../interfaces/pod";

export const usePods = () => {
  const socket = useSocket();
  // State holds Pod[] (the data), not the events!
  const [pods, setPods] = useState<Pod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // 1. Handle Initial List
    const handleList = (payload: K8sListPayload<Pod>) => {
      if (payload.resource !== "pods") return;
      // VALIDATION: Filter out any garbage immediately
      const validItems = (payload.items || []).filter(
        (item) => item && item.metadata,
      );
      setPods(validItems);
      setLoading(false);
    };

    // 2. Handle Events
    const handleEvent = (payload: K8sEventPayload<Pod>) => {
      if (payload.resource !== "pods") return;

      const { type, object } = payload;

      // VALIDATION: Don't process empty objects
      if (!object || !object.metadata) return;

      setPods((prev) => {
        switch (type) {
          case "ADDED":
            // Prevent duplicates
            if (prev.find((p) => p.metadata.uid === object.metadata.uid))
              return prev;
            return [...prev, object]; // Append NEW object

          case "MODIFIED":
            // Find and Replace
            return prev.map((p) =>
              p.metadata.uid === object.metadata.uid ? object : p,
            );

          case "DELETED":
            // Filter out
            return prev.filter((p) => p.metadata.uid !== object.metadata.uid);

          default:
            return prev;
        }
      });
    };

    const handleError = (payload: { message: string }) => {
      console.error("Socket Error:", payload.message);
      setError(payload.message);
      setLoading(false);
    };

    // 1. Setup Listeners
    socket.on(SocketEvent.K8S_LIST, handleList); // <--- Listen for list
    socket.on(SocketEvent.K8S_EVENT, handleEvent); // <--- Listen for updates
    socket.on(SocketEvent.ERROR, handleError);

    // 2. Trigger Subscription
    if (socket.connected) {
      socket.emit(SocketEvent.SUBSCRIBE, "pods");
    } else {
      socket.once("connect", () => {
        socket.emit(SocketEvent.SUBSCRIBE, "pods");
      });
    }

    // 3. Cleanup
    return () => {
      socket.off(SocketEvent.K8S_LIST, handleList);
      socket.off(SocketEvent.K8S_EVENT, handleEvent);
      socket.off(SocketEvent.ERROR, handleError);

      // IMPORTANT: Tell backend to stop watching pods when this component unmounts
      // This prevents the "memory leak" of watchers on the backend
      socket.emit(SocketEvent.UNSUBSCRIBE, "pods");
    };
  }, [socket]);

  return { pods, error, loading, socket };
};
