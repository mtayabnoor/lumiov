export interface ResourceQuota {
  apiVersion: "v1";
  kind: "ResourceQuota";
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
    hard?: Record<string, string>;
    scopes?: string[];
    scopeSelector?: {
      matchExpressions?: Array<{
        scopeName: string;
        operator: string;
        values?: string[];
      }>;
    };
  };
  status?: {
    hard?: Record<string, string>;
    used?: Record<string, string>;
  };
}
