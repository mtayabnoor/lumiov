export type ResourceType = 'pods' | 'deployments' | 'services' | 'statefulsets';

export interface K8sListEvent {
  resource: ResourceType;
  items: any[];
}

export interface K8sUpdateEvent {
  resource: ResourceType;
  type: 'ADDED' | 'MODIFIED' | 'DELETED';
  object: any;
}
