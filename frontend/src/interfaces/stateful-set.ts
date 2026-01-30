import { Pod } from "./pod.js";

export interface StatefulSet {
  apiVersion: "apps/v1";
  kind: "StatefulSet";
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
    serviceName: string;
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
    volumeClaimTemplates?: Array<{
      metadata: {
        name: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec: {
        accessModes: string[];
        resources: {
          requests: {
            storage: string;
          };
        };
        storageClassName?: string;
        [key: string]: any;
      };
    }>;
    podManagementPolicy?: "OrderedReady" | "Parallel";
    updateStrategy?: {
      type?: "RollingUpdate" | "OnDelete";
      rollingUpdate?: {
        partition?: number;
      };
    };
    revisionHistoryLimit?: number;
    persistentVolumeClaimRetentionPolicy?: {
      whenDeleted?: "Retain" | "Delete";
      whenScaled?: "Retain" | "Delete";
    };
    minReadySeconds?: number;
  };
  status?: {
    observedGeneration?: number;
    replicas?: number;
    readyReplicas?: number;
    currentReplicas?: number;
    updatedReplicas?: number;
    currentRevision?: string;
    updateRevision?: string;
    collisionCount?: number;
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
}
