export interface CronJob {
  apiVersion: 'batch/v1';
  kind: 'CronJob';
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
    schedule: string;
    concurrencyPolicy?: 'Allow' | 'Forbid' | 'Replace';
    suspend?: boolean;
    successfulJobsHistoryLimit?: number;
    failedJobsHistoryLimit?: number;
    startingDeadlineSeconds?: number;
    jobTemplate: {
      spec: {
        parallelism?: number;
        completions?: number;
        backoffLimit?: number;
        [key: string]: any;
      };
    };
    [key: string]: any;
  };
  status?: {
    active?: Array<{
      apiVersion?: string;
      kind?: string;
      name?: string;
      namespace?: string;
      uid?: string;
    }>;
    lastScheduleTime?: string;
    lastSuccessfulTime?: string;
  };
}
