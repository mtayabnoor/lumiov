export interface LimitRange {
  apiVersion: "v1";
  kind: "LimitRange";
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
    limits: Array<{
      type: "Pod" | "Container" | "PersistentVolumeClaim" | string;
      max?: Record<string, string>;
      min?: Record<string, string>;
      default?: Record<string, string>;
      defaultRequest?: Record<string, string>;
      maxLimitRequestRatio?: Record<string, string>;
    }>;
  };
}
