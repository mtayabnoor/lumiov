import express from 'express';
import { k8sService } from '../services/kubernetes.service';
import { diagnosePod } from '../agent/diagnosis.service';
import { analyzeYaml } from '../agent/yaml-analysis.service';

const router = express.Router();

// ─── CONTEXT MANAGEMENT ────────────────────────────────────────

router.get('/contexts', (_req, res) => {
  try {
    const result = k8sService.getContexts();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list contexts' });
  }
});

router.post('/contexts/switch', async (req, res) => {
  const { context } = req.body;

  if (!context || typeof context !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "context" in request body' });
    return;
  }

  try {
    await k8sService.switchContext(context);
    res.json({
      success: true,
      context,
      state: k8sService.k8sState,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to switch context',
      state: k8sService.k8sState,
    });
  }
});

router.get('/resource/yaml', async (req, res) => {
  const { apiVersion, kind, namespace, name } = req.query;

  // Basic validation
  // In a real app we might validate 'resourceType' against the enum
  if (!namespace || !name) {
    res.status(400).json({ error: 'Missing namespace or name' });
    return;
  }

  try {
    const data = await k8sService.getResourceGeneric(
      apiVersion as string,
      kind as string,
      namespace as string,
      name as string,
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch resource' });
  }
});

// UPDATE Resource
router.put('/resource/yaml', async (req, res) => {
  const updatedBody = req.body;

  if (!updatedBody) {
    res.status(400).json({ error: 'Missing request body' });
    return;
  }

  try {
    const result = await k8sService.updateResourceGeneric(updatedBody);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update resource' });
  }
});

// Define a list of known Cluster-Scoped resources
// These resources exist at the root level, not inside a namespace.
const CLUSTER_SCOPED_KINDS = new Set([
  'Namespace',
  'Node',
  'PersistentVolume',
  'ClusterRole',
  'ClusterRoleBinding',
  'StorageClass',
  'CustomResourceDefinition',
  'IngressClass',
  'PriorityClass',
]);

router.delete('/resource', async (req, res) => {
  const { apiVersion, kind, namespace, name } = req.query;

  // 1. Basic Validation: Name and Kind are always required
  if (!name || !kind) {
    res.status(400).json({ error: 'Missing name or kind' });
    return;
  }

  const resourceKind = kind as string;
  const isClusterScoped = CLUSTER_SCOPED_KINDS.has(resourceKind);

  // 2. Conditional Namespace Validation
  // If it is NOT cluster-scoped, we enforce that a namespace must be provided
  if (!isClusterScoped && !namespace) {
    res.status(400).json({ error: `Namespace is required for resource type: ${kind}` });
    return;
  }

  try {
    const data = await k8sService.deleteResourceGeneric(
      apiVersion as string,
      resourceKind,
      name as string,
      // Pass 'undefined' if namespace is empty string or null, so the service knows it's global
      (namespace as string) || undefined,
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete resource' });
  }
});

// ─── POD DIAGNOSIS ──────────────────────────────────────────────

router.post('/diagnose', async (req, res) => {
  const { namespace, podName, apiKey } = req.body;

  if (!namespace || !podName || !apiKey) {
    res.status(400).json({ error: 'Missing namespace, podName, or apiKey' });
    return;
  }

  try {
    const result = await diagnosePod({ namespace, podName, apiKey });

    if (result.error) {
      res.status(422).json({ error: result.error, rawData: result.rawData });
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Diagnosis failed' });
  }
});

// ─── YAML AI ANALYSIS ──────────────────────────────────────────

router.post('/analyze-yaml', async (req, res) => {
  const { yaml: yamlContent, apiKey } = req.body;

  if (!yamlContent || !apiKey) {
    res.status(400).json({ error: 'Missing yaml content or apiKey' });
    return;
  }

  try {
    const result = await analyzeYaml({ yaml: yamlContent, apiKey });

    if (result.error) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.json(result.response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'YAML analysis failed' });
  }
});

// ─── CREATE / APPLY RESOURCE ───────────────────────────────────

router.post('/resource/apply', async (req, res) => {
  const yamlBody = req.body;

  if (!yamlBody) {
    res.status(400).json({ error: 'Missing YAML request body' });
    return;
  }

  try {
    const result = await k8sService.createResourceGeneric(
      typeof yamlBody === 'string' ? yamlBody : JSON.stringify(yamlBody),
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to apply resource' });
  }
});

export const resourceRouter = router;
