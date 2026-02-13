export interface HorizontalPodAutoscaler {
  apiVersion: "autoscaling/v1";
  kind: "HorizontalPodAutoscaler";
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
    scaleTargetRef: {
      apiVersion?: string;
      kind: string;
      name: string;
    };
    minReplicas?: number;
    maxReplicas: number;
    targetCPUUtilizationPercentage?: number;
  };
  status?: {
    observedGeneration?: number;
    lastScaleTime?: string;
    currentReplicas?: number;
    desiredReplicas?: number;
    currentCPUUtilizationPercentage?: number;
  };
}
