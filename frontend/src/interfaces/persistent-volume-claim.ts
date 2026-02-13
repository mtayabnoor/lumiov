export interface PersistentVolumeClaim {
  apiVersion: "v1";
  kind: "PersistentVolumeClaim";
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
    accessModes?: string[];
    resources?: {
      requests?: Record<string, string>;
      limits?: Record<string, string>;
    };
    storageClassName?: string;
    volumeName?: string;
    volumeMode?: "Filesystem" | "Block";
    selector?: {
      matchLabels?: Record<string, string>;
    };
    [key: string]: any;
  };
  status?: {
    phase?: "Pending" | "Bound" | "Lost";
    accessModes?: string[];
    capacity?: Record<string, string>;
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
}
