export const SocketEvent = {
  WATCH: "watch",
  DATA: "data",
  ERROR: "error",
  EXEC: "exec",
  EXEC_DATA: "exec-data",
  EXEC_INPUT: "exec-input",
  EXEC_RESIZE: "exec-resize",
  EXEC_ERROR: "exec-error",
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

export interface ExecParams {
  namespace: string;
  podName: string;
  container?: string;
}

export interface ExecResizeParams {
  rows: number;
  cols: number;
}

// Map events to their payloads
export interface ServerToClientEvents {
  [SocketEvent.DATA]: (payload: WatchResourcePayload) => void;
  [SocketEvent.ERROR]: (payload: ErrorPayload) => void;
  [SocketEvent.EXEC_DATA]: (data: string) => void;
  [SocketEvent.EXEC_ERROR]: (payload: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  [SocketEvent.WATCH]: (resource: ResourceType) => void;
  [SocketEvent.EXEC]: (params: ExecParams) => void;
  [SocketEvent.EXEC_INPUT]: (data: string) => void;
  [SocketEvent.EXEC_RESIZE]: (params: ExecResizeParams) => void;
}
