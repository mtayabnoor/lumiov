export interface Job {
  apiVersion: 'batch/v1';
  kind: 'Job';
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
    parallelism?: number;
    completions?: number;
    backoffLimit?: number;
    activeDeadlineSeconds?: number;
    ttlSecondsAfterFinished?: number;
    selector?: {
      matchLabels?: Record<string, string>;
    };
    [key: string]: any;
  };
  status?: {
    conditions?: Array<{
      type: string;
      status: string;
      lastProbeTime?: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
    startTime?: string;
    completionTime?: string;
    active?: number;
    succeeded?: number;
    failed?: number;
  };
}
