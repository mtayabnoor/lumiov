/**
 * Tool Safety Context
 *
 * Shared interface passed to mutating agent tools so they can register
 * a pending safety action that must be confirmed by the user before execution.
 *
 * Import this type instead of re-declaring the interface in each tool file.
 */

import type { PendingAction } from '../safety/safety-policy.service';

export interface ToolSafetyContext {
  /** Called by a tool when its action requires user confirmation before executing. */
  setPendingAction: (action: PendingAction) => void;
}
