export interface StorageClass {
  apiVersion: 'storage.k8s.io/v1';
  kind: 'StorageClass';
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  provisioner: string;
  parameters?: Record<string, string>;
  reclaimPolicy?: 'Retain' | 'Delete';
  mountOptions?: string[];
  allowVolumeExpansion?: boolean;
  volumeBindingMode?: 'Immediate' | 'WaitForFirstConsumer';
}
