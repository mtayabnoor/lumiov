export interface PolicyRule {
  apiGroups?: string[];
  resources?: string[];
  resourceNames?: string[];
  verbs: string[];
  nonResourceURLs?: string[];
}

export interface Role {
  apiVersion: "rbac.authorization.k8s.io/v1";
  kind: "Role";
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  rules?: PolicyRule[];
}

export interface ClusterRole {
  apiVersion: "rbac.authorization.k8s.io/v1";
  kind: "ClusterRole";
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  rules?: PolicyRule[];
  aggregationRule?: {
    clusterRoleSelectors?: Array<{
      matchLabels?: Record<string, string>;
    }>;
  };
}
