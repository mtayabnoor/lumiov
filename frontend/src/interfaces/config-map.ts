export interface ConfigMap {
  apiVersion: 'v1';
  kind: 'ConfigMap';
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}
