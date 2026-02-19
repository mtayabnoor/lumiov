export interface ReplicaSet {
  apiVersion: 'apps/v1';
  kind: 'ReplicaSet';
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{
      apiVersion: string;
      kind: string;
      name: string;
      uid: string;
      controller?: boolean;
    }>;
    [key: string]: any;
  };
  spec: {
    replicas?: number;
    selector: {
      matchLabels?: Record<string, string>;
    };
    [key: string]: any;
  };
  status?: {
    replicas?: number;
    fullyLabeledReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    observedGeneration?: number;
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
}
