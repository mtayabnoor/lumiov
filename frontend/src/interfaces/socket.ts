export const SocketEvent = {
  WATCH: "watch",
  DATA: "data",
  ERROR: "error",
  EXEC: "exec",
  EXEC_DATA: "exec-data",
  EXEC_INPUT: "exec-input",
  EXEC_RESIZE: "exec-resize",
  EXEC_ERROR: "exec-error",
  K8S_LIST: "k8s-list",
  K8S_EVENT: "k8s-event",
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
} as const;

export type ResourceType = "pods" | "deployments" | "namespaces";

export interface K8sListPayload<T = any> {
  resource: ResourceType;
  items: T[];
}

export interface K8sEventPayload<T = any> {
  resource: ResourceType;
  type: "ADDED" | "MODIFIED" | "DELETED";
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
  [SocketEvent.K8S_EVENT]: (payload: K8sEventPayload) => void;
  [SocketEvent.K8S_LIST]: (payload: K8sListPayload) => void;
  [SocketEvent.ERROR]: (payload: ErrorPayload) => void;
  [SocketEvent.EXEC_DATA]: (data: string) => void;
  [SocketEvent.EXEC_ERROR]: (payload: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  [SocketEvent.SUBSCRIBE]: (resource: ResourceType) => void;
  [SocketEvent.EXEC]: (params: ExecParams) => void;
  [SocketEvent.EXEC_INPUT]: (data: string) => void;
  [SocketEvent.EXEC_RESIZE]: (params: ExecResizeParams) => void;
  [SocketEvent.UNSUBSCRIBE]: (resource: ResourceType) => void;
}
