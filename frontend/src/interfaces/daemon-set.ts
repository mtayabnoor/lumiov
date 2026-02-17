import { Pod } from './pod.js';

export type IntOrString = number | string; // e.g., 1 or "30%"

export interface DaemonSet {
  apiVersion: 'apps/v1';
  kind: 'DaemonSet';
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
    selector: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<{
        key: string;
        operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | string;
        values?: string[];
      }>;
    };

    // Pod template
    template: {
      metadata: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
      spec: Pod;
    };

    // Rollout/behavior
    updateStrategy?: {
      type?: 'RollingUpdate' | 'OnDelete';
      rollingUpdate?: {
        // Max nodes that can be unavailable during update (int or % string)
        maxUnavailable?: IntOrString;
      };
    };

    // Timing & history
    minReadySeconds?: number;
    revisionHistoryLimit?: number;
  };
  status?: {
    observedGeneration?: number;

    // Scheduling counts
    desiredNumberScheduled?: number;
    currentNumberScheduled?: number;
    numberMisscheduled?: number;

    // Readiness/availability
    numberReady?: number;
    updatedNumberScheduled?: number;
    numberAvailable?: number;
    numberUnavailable?: number;

    // Collisions (controller)
    collisionCount?: number;

    // Conditions
    conditions?: Array<{
      type: string; // e.g., "Ready", "NumberUnavailable", etc.
      status: 'True' | 'False' | 'Unknown' | string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
  };
}
