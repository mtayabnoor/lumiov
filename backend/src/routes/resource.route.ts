import express from 'express';
import { k8sService } from '../services/kubernetes.service';

const router = express.Router();

// GET Resource (YAML/JSON)
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

router.delete('/resource', async (req, res) => {
  const { apiVersion, kind, namespace, name } = req.query;

  // Basic validation
  // In a real app we might validate 'resourceType' against the enum
  if (!namespace || !name) {
    res.status(400).json({ error: 'Missing namespace or name' });
    return;
  }

  try {
    const data = await k8sService.deleteResourceGeneric(
      apiVersion as string,
      kind as string,
      name as string,
      namespace as string,
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch resource' });
  }
});
export const resourceRouter = router;
