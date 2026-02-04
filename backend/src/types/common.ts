export interface ShellSession {
  write: (data: string) => void;
  kill: () => void;
  resize?: (cols: number, rows: number) => void;
}

export type ResourceType =
  | 'pods'
  | 'deployments'
  | 'services'
  | 'statefulsets'
  | 'namespaces';

export interface K8sListEvent {
  resource: ResourceType;
  items: any[];
}

export interface K8sUpdateEvent {
  resource: ResourceType;
  type: 'ADDED' | 'MODIFIED' | 'DELETED';
  object: any;
}
