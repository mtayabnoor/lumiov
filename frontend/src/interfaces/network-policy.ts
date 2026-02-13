export interface NetworkPolicy {
  apiVersion: "networking.k8s.io/v1";
  kind: "NetworkPolicy";
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
    podSelector: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<{
        key: string;
        operator: string;
        values?: string[];
      }>;
    };
    policyTypes?: Array<"Ingress" | "Egress">;
    ingress?: Array<{
      from?: Array<{
        podSelector?: { matchLabels?: Record<string, string> };
        namespaceSelector?: { matchLabels?: Record<string, string> };
        ipBlock?: { cidr: string; except?: string[] };
      }>;
      ports?: Array<{
        protocol?: string;
        port?: number | string;
      }>;
    }>;
    egress?: Array<{
      to?: Array<{
        podSelector?: { matchLabels?: Record<string, string> };
        namespaceSelector?: { matchLabels?: Record<string, string> };
        ipBlock?: { cidr: string; except?: string[] };
      }>;
      ports?: Array<{
        protocol?: string;
        port?: number | string;
      }>;
    }>;
  };
}
