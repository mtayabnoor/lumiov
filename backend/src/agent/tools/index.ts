/**
 * Agent Tools - Index
 *
 * This file exports all available LangChain tools for the cluster agent.
 * To add a new tool:
 * 1. Create a new file in this directory (e.g., my-tool.ts)
 * 2. Export a function that creates the DynamicStructuredTool
 * 3. Add it to the imports and createAllTools array below
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { createGetPodsTool } from './get-pods.tool';
import { createGetDeploymentsTool } from './get-deployments.tool';
import { createGetNamespacesTool } from './get-namespaces.tool';
import { createDescribePodTool } from './describe-pod.tool';
import { createDeletePodTool } from './delete-pod.tool';
import { createScaleDeploymentTool } from './scale-deployment';

// Re-export for individual use
export {
  createGetPodsTool,
  createGetDeploymentsTool,
  createGetNamespacesTool,
  createDescribePodTool,
  createDeletePodTool,
  createScaleDeploymentTool,
};

/**
 * Creates all available cluster tools.
 * Add new tools to this array to make them available to the agent.
 */
export function createAllTools(): DynamicStructuredTool[] {
  return [
    createGetPodsTool(),
    createGetDeploymentsTool(),
    createGetNamespacesTool(),
    createDescribePodTool(),
    createDeletePodTool(),
    createScaleDeploymentTool(),
  ];
}
