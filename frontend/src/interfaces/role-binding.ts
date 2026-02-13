export interface RoleBinding {
  apiVersion: "rbac.authorization.k8s.io/v1";
  kind: "RoleBinding";
  metadata: {
    name: string;
    namespace: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  subjects?: Array<{
    kind: "User" | "Group" | "ServiceAccount";
    name: string;
    namespace?: string;
    apiGroup?: string;
  }>;
  roleRef: {
    apiGroup: string;
    kind: "Role" | "ClusterRole";
    name: string;
  };
}

export interface ClusterRoleBinding {
  apiVersion: "rbac.authorization.k8s.io/v1";
  kind: "ClusterRoleBinding";
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  subjects?: Array<{
    kind: "User" | "Group" | "ServiceAccount";
    name: string;
    namespace?: string;
    apiGroup?: string;
  }>;
  roleRef: {
    apiGroup: string;
    kind: "ClusterRole";
    name: string;
  };
}
