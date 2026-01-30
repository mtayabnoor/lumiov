export interface K8sWatchEvent<T> {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'ERROR' | 'BOOKMARK';
  object: T;
}
