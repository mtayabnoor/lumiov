export interface Pod {
  apiVersion: 'v1';
  kind: 'Pod';
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    deletionTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    containers?: Container[];
    nodeName?: string;
    serviceAccountName: string;
    priority: number;
    [key: string]: any;
  };
  status: {
    phase?: string;
    conditions?: Condition[];
    containerStatuses?: ContainerStatus[];
    qosClass: string;
    hostIP: string;
    podIP: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export enum PodPhase {
  Running = 'Running',
  Pending = 'Pending',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Unknown = 'Unknown',
}

export interface Container {
  name: string;
  image: string;
  resources?: {
    requests?: {
      cpu?: string;
      memory?: string;
    };
    limits?: {
      cpu?: string;
      memory?: string;
    };
  };
  [key: string]: any;
}

export interface ContainerStatus {
  name: string;
  ready: boolean;
  restartCount: number;
  state?: {
    running?: { startedAt: string };
    waiting?: { reason: string; message?: string };
    terminated?: { exitCode: number; reason?: string };
  };
  [key: string]: any;
}

export interface Condition {
  type: string;
  status: string;
  lastProbeTime?: string;
  lastTransitionTime?: string;
}
