export interface Node {
  apiVersion: "v1";
  kind: "Node";
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec: {
    podCIDR?: string;
    podCIDRs?: string[];
    providerID?: string;
    unschedulable?: boolean;
    taints?: Array<{
      key: string;
      value?: string;
      effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
      timeAdded?: string;
    }>;
    [key: string]: any;
  };
  status?: {
    capacity?: Record<string, string>;
    allocatable?: Record<string, string>;
    conditions?: Array<{
      type: string;
      status: "True" | "False" | "Unknown";
      lastHeartbeatTime?: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
    addresses?: Array<{
      type: string;
      address: string;
    }>;
    nodeInfo?: {
      machineID?: string;
      systemUUID?: string;
      bootID?: string;
      kernelVersion?: string;
      osImage?: string;
      containerRuntimeVersion?: string;
      kubeletVersion?: string;
      kubeProxyVersion?: string;
      operatingSystem?: string;
      architecture?: string;
    };
    [key: string]: any;
  };
}
