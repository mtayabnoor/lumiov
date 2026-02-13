import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import {
  SocketEvent,
  K8sEventPayload,
  K8sListPayload,
  ResourceType,
} from "../interfaces/socket";

interface ResourceWithMetadata {
  metadata: {
    name: string;
    [key: string]: any; // Allow other metadata fields
  };
}

export const useResource = <T extends ResourceWithMetadata>(
  resource: ResourceType,
) => {
  const socket = useSocket();
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // 1. Handle Initial List
    const handleList = (payload: K8sListPayload<T>) => {
      if (payload.resource !== resource) return;
      // VALIDATION: Filter out any garbage immediately
      const validItems = (payload.items || []).filter(
        (item) => item && item.metadata,
      );
      setData(validItems);
      setLoading(false);
    };

    const handleEvent = (payload: K8sEventPayload<T>) => {
      // 1. Guard: Wrong Resource Type
      if (payload.resource !== resource) return;

      const { type, object } = payload;

      // BOOKMARK events are K8s watch checkpoints, not data changes — ignore
      if (type === "BOOKMARK") return;

      // 2. Guard: Invalid Data
      if (!object || !object.metadata?.uid) {
        console.warn("Received invalid K8s event", payload);
        return;
      }

      setData((prev) => {
        // 3. Performance Optimization:
        // If the list is empty and it's not an ADD, we might just return (unless we handle Upsert)
        if (prev.length === 0 && type !== "ADDED" && type !== "MODIFIED")
          return prev;

        switch (type) {
          case "ADDED":
            // Check if it already exists to prevent duplicates (Idempotency)
            if (prev.some((p) => p.metadata.uid === object.metadata.uid)) {
              // OPTIONAL: Even if it exists, it might be newer version.
              // Treat ADDED as MODIFIED if it exists is often safer.
              return prev.map((p) =>
                p.metadata.uid === object.metadata.uid ? object : p,
              );
            }
            return [...prev, object];

          case "MODIFIED":
            // CRITICAL FIX: "Upsert" logic.
            // If we find it, update it. If we DON'T find it, add it.
            const exists = prev.some(
              (p) => p.metadata.uid === object.metadata.uid,
            );

            if (exists) {
              return prev.map((p) =>
                p.metadata.uid === object.metadata.uid ? object : p,
              );
            } else {
              // It wasn't in our list (maybe we missed the ADD event), so add it now.
              return [...prev, object];
            }

          case "DELETED":
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
      socket.emit(SocketEvent.SUBSCRIBE, resource);
    } else {
      socket.once("connect", () => {
        socket.emit(SocketEvent.SUBSCRIBE, resource);
      });
    }

    // 3. Cleanup
    return () => {
      socket.off(SocketEvent.K8S_LIST, handleList);
      socket.off(SocketEvent.K8S_EVENT, handleEvent);
      socket.off(SocketEvent.ERROR, handleError);
      socket.emit(SocketEvent.UNSUBSCRIBE, resource);
    };
  }, [socket]);

  return { data, error, loading, socket };
};
