export interface CustomResourceDefinition {
  apiVersion: 'apiextensions.k8s.io/v1';
  kind: 'CustomResourceDefinition';
  metadata: {
    name: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    [key: string]: any;
  };
  spec: {
    group: string;
    names: {
      plural: string;
      singular?: string;
      kind: string;
      shortNames?: string[];
      listKind?: string;
      categories?: string[];
    };
    scope: 'Namespaced' | 'Cluster';
    versions: Array<{
      name: string;
      served: boolean;
      storage: boolean;
      schema?: {
        openAPIV3Schema?: Record<string, any>;
      };
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  status?: {
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime?: string;
      reason?: string;
      message?: string;
    }>;
    acceptedNames?: {
      plural: string;
      singular?: string;
      kind: string;
      shortNames?: string[];
    };
    storedVersions?: string[];
  };
}
