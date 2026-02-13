export interface ShellSession {
  write: (data: string) => void;
  kill: () => void;
  resize?: (cols: number, rows: number) => void;
}

export type ResourceType =
  // Cluster
  | 'namespaces'
  | 'nodes'
  // Workloads
  | 'pods'
  | 'deployments'
  | 'statefulsets'
  | 'daemonsets'
  | 'replicasets'
  | 'jobs'
  | 'cronjobs'
  // Storage
  | 'persistentvolumeclaims'
  | 'persistentvolumes'
  | 'storageclasses'
  // Network
  | 'services'
  | 'ingresses'
  | 'networkpolicies'
  | 'endpoints'
  // Configuration
  | 'configmaps'
  | 'secrets'
  | 'resourcequotas'
  | 'limitranges'
  | 'horizontalpodautoscalers'
  // Access Control
  | 'serviceaccounts'
  | 'roles'
  | 'rolebindings'
  | 'clusterroles'
  | 'clusterrolebindings'
  // Custom Resources
  | 'customresourcedefinitions';

export interface K8sListEvent {
  resource: ResourceType;
  items: any[];
}

export interface K8sUpdateEvent {
  resource: ResourceType;
  type: 'ADDED' | 'MODIFIED' | 'DELETED';
  object: any;
}
