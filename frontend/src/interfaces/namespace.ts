export interface Namespace {
  kind: 'Namespace';
  apiVersion: 'v1';
  metadata: NamespaceMetadata;
  spec?: NamespaceSpec;
  status?: NamespaceStatus;
}

export interface NamespaceMetadata {
  name: string;
  uid: string;
  resourceVersion: string;
  creationTimestamp: string;
  labels?: Record<string, string>; // e.g. { "environment": "production" }
  annotations?: Record<string, string>; // e.g. { "openshift.io/description": "..." }
  ownerReferences?: OwnerReference[];
}

export interface NamespaceSpec {
  // Finalizers are keys used for garbage collection (e.g., "kubernetes")
  finalizers?: string[];
}

export interface NamespaceStatus {
  // The most important field. Usually "Active" or "Terminating"
  phase: 'Active' | 'Terminating';

  // Conditions explain why the namespace is in its current phase (optional)
  conditions?: NamespaceCondition[];
}

export interface NamespaceCondition {
  type: string; // e.g., "NamespaceDeletionDiscoveryFailure"
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
}
