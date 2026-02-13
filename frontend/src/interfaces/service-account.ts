export interface ServiceAccount {
  apiVersion: "v1";
  kind: "ServiceAccount";
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  secrets?: Array<{
    name: string;
    namespace?: string;
  }>;
  imagePullSecrets?: Array<{
    name: string;
  }>;
  automountServiceAccountToken?: boolean;
}
