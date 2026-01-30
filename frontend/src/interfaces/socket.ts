export const SocketEvent = {
  WATCH: "watch",
  DATA: "data",
  ERROR: "error",
} as const;

export type ResourceType = "pods" | "deployments";

export interface WatchResourcePayload<T = any> {
  resource: ResourceType;
  action: "ADDED" | "MODIFIED" | "DELETED";
  object: T;
}

export interface ErrorPayload {
  message: string;
}

// Map events to their payloads
export interface ServerToClientEvents {
  [SocketEvent.DATA]: (payload: WatchResourcePayload) => void;
  [SocketEvent.ERROR]: (payload: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  [SocketEvent.WATCH]: (resource: ResourceType) => void;
}
