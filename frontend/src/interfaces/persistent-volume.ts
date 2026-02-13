export interface PersistentVolume {
  apiVersion: "v1";
  kind: "PersistentVolume";
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec: {
    capacity?: Record<string, string>;
    accessModes?: string[];
    persistentVolumeReclaimPolicy?: "Retain" | "Recycle" | "Delete";
    storageClassName?: string;
    volumeMode?: "Filesystem" | "Block";
    claimRef?: {
      kind?: string;
      namespace?: string;
      name?: string;
      uid?: string;
    };
    mountOptions?: string[];
    [key: string]: any;
  };
  status?: {
    phase?: "Available" | "Bound" | "Released" | "Failed" | "Pending";
    message?: string;
    reason?: string;
  };
}
