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
//import { createDeletePodTool } from './delete-pod.tool';
//import { createScaleDeploymentTool } from './scale-deployment';
import { createDiagnosePodTool } from './diagnose-pod.tool';

// Re-export for individual use
export {
  createGetPodsTool,
  createGetDeploymentsTool,
  createGetNamespacesTool,
  createDescribePodTool,
  //createDeletePodTool,
  //createScaleDeploymentTool,
  createDiagnosePodTool,
};

/**
 * Creates all available cluster tools.
 * Add new tools to this array to make them available to the agent.
 */
export function createAllTools(apiKey?: string): DynamicStructuredTool[] {
  const tools: DynamicStructuredTool[] = [
    createGetPodsTool(),
    createGetDeploymentsTool(),
    createGetNamespacesTool(),
    createDescribePodTool(),
    //createDeletePodTool(),
    //createScaleDeploymentTool(),
  ];

  // Add diagnosis tool when API key is available
  if (apiKey) {
    tools.push(createDiagnosePodTool(apiKey));
  }

  return tools;
}
