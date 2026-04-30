import { randomUUID } from 'crypto';

// ─── Types ────────────────────────────────────────────────────

export type GuardrailCode =
  | 'PROTECTED_NAMESPACE'
  | 'REPLICA_LIMIT_EXCEEDED'
  | 'INVALID_REPLICA_COUNT'
  | 'RISKY_SCALE_CONFIRMATION_REQUIRED'
  | 'RISKY_DELETE_CONFIRMATION_REQUIRED'
  | 'PROTECTED_POD';

export type PendingActionType = 'scale_deployment' | 'delete_pod';

export interface PendingAction {
  id: string;
  type: PendingActionType;
  summary: string;
  params: {
    name: string;
    namespace: string;
    replicas?: number;
  };
  createdAt: number;
  expiresAt: number;
}

export interface GuardrailDecision {
  allow: boolean;
  requiresConfirmation: boolean;
  code?: GuardrailCode;
  message?: string;
}

// ─── Constants ────────────────────────────────────────────────

const PROTECTED_NAMESPACES = new Set(['kube-system', 'kube-public', 'kube-node-lease']);

const PROTECTED_POD_NAME_PREFIXES = [
  'kube-apiserver',
  'kube-controller-manager',
  'kube-scheduler',
  'etcd',
  'coredns',
];

export const SAFETY_LIMITS = {
  maxReplicas: 20,
  confirmationReplicaThreshold: 20,
  maxReplicaIncreasePerAction: 20,
  maxReplicaMultiplierPerAction: 3,
  pendingActionTtlMs: 2 * 60 * 1000,
} as const;

// ─── Evaluators ───────────────────────────────────────────────

export function isProtectedNamespace(namespace: string): boolean {
  return PROTECTED_NAMESPACES.has(namespace);
}

export function evaluateScaleRequest(
  name: string,
  namespace: string,
  replicas: number,
  currentReplicas: number | null,
): GuardrailDecision {
  if (isProtectedNamespace(namespace)) {
    return {
      allow: false,
      requiresConfirmation: false,
      code: 'PROTECTED_NAMESPACE',
      message: `Scaling is blocked in protected namespace ${namespace}.`,
    };
  }

  if (!Number.isFinite(replicas) || replicas < 0) {
    return {
      allow: false,
      requiresConfirmation: false,
      code: 'INVALID_REPLICA_COUNT',
      message: 'Replica count must be a non-negative integer.',
    };
  }

  if (replicas > SAFETY_LIMITS.maxReplicas) {
    return {
      allow: false,
      requiresConfirmation: false,
      code: 'REPLICA_LIMIT_EXCEEDED',
      message: `Requested replicas (${replicas}) exceeds safety limit (${SAFETY_LIMITS.maxReplicas}).`,
    };
  }

  if (replicas >= SAFETY_LIMITS.confirmationReplicaThreshold) {
    return {
      allow: false,
      requiresConfirmation: true,
      code: 'RISKY_SCALE_CONFIRMATION_REQUIRED',
      message: `Scaling ${name} in ${namespace} to ${replicas} replicas is considered high-impact and requires confirmation.`,
    };
  }

  if (currentReplicas !== null && currentReplicas >= 0) {
    const increase = replicas - currentReplicas;

    if (increase > SAFETY_LIMITS.maxReplicaIncreasePerAction) {
      return {
        allow: false,
        requiresConfirmation: true,
        code: 'RISKY_SCALE_CONFIRMATION_REQUIRED',
        message: `Replica increase (${currentReplicas} -> ${replicas}) is above single-action limit and requires confirmation.`,
      };
    }

    if (
      currentReplicas > 0 &&
      replicas / currentReplicas > SAFETY_LIMITS.maxReplicaMultiplierPerAction
    ) {
      return {
        allow: false,
        requiresConfirmation: true,
        code: 'RISKY_SCALE_CONFIRMATION_REQUIRED',
        message: `Scaling by more than ${SAFETY_LIMITS.maxReplicaMultiplierPerAction}x in one action requires confirmation.`,
      };
    }
  }

  return { allow: true, requiresConfirmation: false };
}

export function evaluateDeletePodRequest(
  name: string,
  namespace: string,
): GuardrailDecision {
  if (isProtectedNamespace(namespace)) {
    return {
      allow: false,
      requiresConfirmation: false,
      code: 'PROTECTED_NAMESPACE',
      message: `Deleting pods is blocked in protected namespace ${namespace}.`,
    };
  }

  if (PROTECTED_POD_NAME_PREFIXES.some((prefix) => name.startsWith(prefix))) {
    return {
      allow: false,
      requiresConfirmation: false,
      code: 'PROTECTED_POD',
      message: `Pod ${name} appears to be a critical system pod and cannot be deleted via agent tools.`,
    };
  }

  return {
    allow: false,
    requiresConfirmation: true,
    code: 'RISKY_DELETE_CONFIRMATION_REQUIRED',
    message: `Deleting pod ${name} in ${namespace} requires explicit confirmation.`,
  };
}

// ─── Pending Action Helpers ───────────────────────────────────

export function createPendingAction(
  action: Omit<PendingAction, 'id' | 'createdAt' | 'expiresAt'>,
): PendingAction {
  const now = Date.now();

  return {
    id: randomUUID(),
    createdAt: now,
    expiresAt: now + SAFETY_LIMITS.pendingActionTtlMs,
    ...action,
  };
}

export function isPendingActionExpired(action: PendingAction): boolean {
  return Date.now() > action.expiresAt;
}

// ─── Message Builders ─────────────────────────────────────────

export function buildConfirmationMessage(action: PendingAction): string {
  return [
    'Safety confirmation required before executing this action.',
    `Action: ${action.summary}`,
    `To confirm this exact action, reply: confirm ${action.id}`,
    `Reference: ${action.type} (${action.params.namespace}/${action.params.name})`,
    'Or reply: cancel',
  ].join('\n');
}
