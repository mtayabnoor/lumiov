import express from 'express';
import { k8sService } from '../services/kubernetes.service';
import { diagnosePod } from '../agent/diagnosis.service';
import { analyzeYaml } from '../agent/yaml-analysis.service';
import { toAppError } from '../types/errors';

const router = express.Router();

// ─── CONTEXT MANAGEMENT ────────────────────────────────────────

router.get('/contexts', (_req, res) => {
  try {
    const result = k8sService.getContexts();
    res.json(result);
  } catch (err) {
    res.status(500).json(toAppError(err, 'CONTEXTS_LIST_FAILED', true));
  }
});

router.post('/contexts/switch', async (req, res) => {
  const { context } = req.body;

  if (!context || typeof context !== 'string') {
    res
      .status(400)
      .json(
        toAppError(
          'Missing or invalid "context" in request body',
          'INVALID_CONTEXT',
          false,
        ),
      );
    return;
  }

  // Validate context exists before switching (prevents injection of arbitrary names)
  const { contexts } = k8sService.getContexts();
  if (!contexts.some((c: { name: string }) => c.name === context)) {
    res
      .status(400)
      .json(toAppError(`Unknown context: ${context}`, 'UNKNOWN_CONTEXT', false));
    return;
  }

  try {
    await k8sService.switchContext(context);
    res.json({ success: true, context, state: k8sService.k8sState });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        state: k8sService.k8sState,
        ...toAppError(err, 'CONTEXT_SWITCH_FAILED', true),
      });
  }
});

router.get('/resource/yaml', async (req, res) => {
  const { apiVersion, kind, namespace, name } = req.query;

  if (!namespace || !name) {
    res
      .status(400)
      .json(toAppError('Missing namespace or name', 'VALIDATION_ERROR', false));
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
  } catch (err) {
    res.status(500).json(toAppError(err, 'RESOURCE_FETCH_FAILED', true));
  }
});

// UPDATE Resource
router.put('/resource/yaml', async (req, res) => {
  const updatedBody = req.body;

  if (!updatedBody) {
    res.status(400).json(toAppError('Missing request body', 'VALIDATION_ERROR', false));
    return;
  }

  try {
    const result = await k8sService.updateResourceGeneric(updatedBody);
    res.json(result);
  } catch (err) {
    res.status(500).json(toAppError(err, 'RESOURCE_UPDATE_FAILED', true));
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

  if (!name || !kind) {
    res.status(400).json(toAppError('Missing name or kind', 'VALIDATION_ERROR', false));
    return;
  }

  const resourceKind = kind as string;
  const isClusterScoped = CLUSTER_SCOPED_KINDS.has(resourceKind);

  if (!isClusterScoped && !namespace) {
    res
      .status(400)
      .json(
        toAppError(
          `Namespace is required for resource type: ${kind}`,
          'VALIDATION_ERROR',
          false,
        ),
      );
    return;
  }

  try {
    const data = await k8sService.deleteResourceGeneric(
      apiVersion as string,
      resourceKind,
      name as string,
      (namespace as string) || undefined,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json(toAppError(err, 'RESOURCE_DELETE_FAILED', true));
  }
});

// ─── POD DIAGNOSIS ──────────────────────────────────────────────

router.post('/diagnose', async (req, res) => {
  const { namespace, podName, apiKey } = req.body;

  if (!namespace || !podName || !apiKey) {
    res
      .status(400)
      .json(
        toAppError('Missing namespace, podName, or apiKey', 'VALIDATION_ERROR', false),
      );
    return;
  }

  try {
    const result = await diagnosePod({ namespace, podName, apiKey });

    if (result.error) {
      res
        .status(422)
        .json({
          ...toAppError(result.error, 'DIAGNOSIS_LLM_ERROR', false),
          rawData: result.rawData,
        });
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json(toAppError(err, 'DIAGNOSIS_FAILED', true));
  }
});

// ─── YAML AI ANALYSIS ──────────────────────────────────────────

router.post('/analyze-yaml', async (req, res) => {
  const { yaml: yamlContent, apiKey } = req.body;

  if (!yamlContent || !apiKey) {
    res
      .status(400)
      .json(toAppError('Missing yaml content or apiKey', 'VALIDATION_ERROR', false));
    return;
  }

  try {
    const result = await analyzeYaml({ yaml: yamlContent, apiKey });

    if (result.error) {
      res.status(422).json(toAppError(result.error, 'ANALYSIS_LLM_ERROR', false));
      return;
    }

    res.json(result.response);
  } catch (err) {
    res.status(500).json(toAppError(err, 'ANALYSIS_FAILED', true));
  }
});

// ─── CREATE / APPLY RESOURCE ───────────────────────────────────

router.post('/resource/apply', async (req, res) => {
  const yamlBody = req.body;

  if (!yamlBody) {
    res
      .status(400)
      .json(toAppError('Missing YAML request body', 'VALIDATION_ERROR', false));
    return;
  }

  try {
    const result = await k8sService.createResourceGeneric(
      typeof yamlBody === 'string' ? yamlBody : JSON.stringify(yamlBody),
    );
    res.json(result);
  } catch (err) {
    res.status(500).json(toAppError(err, 'RESOURCE_APPLY_FAILED', true));
  }
});

export const resourceRouter = router;
