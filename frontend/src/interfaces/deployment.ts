import type { Pod } from './pod.js';

export interface Deployment {
  apiVersion: 'apps/v1';
  kind: 'Deployment';
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec: {
    replicas?: number;
    selector: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<{
        key: string;
        operator: string;
        values?: string[];
      }>;
    };
    template: {
      metadata: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec: Pod;
    };
    strategy?: {
      type?: string;
      rollingUpdate?: {
        maxUnavailable?: number | string;
        maxSurge?: number | string;
      };
    };
  };
  status?: {
    observedGeneration?: number;
    replicas?: number;
    updatedReplicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    unavailableReplicas?: number;
    conditions?: Array<{
      type: string;
      status: string;
      lastUpdateTime?: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
}
