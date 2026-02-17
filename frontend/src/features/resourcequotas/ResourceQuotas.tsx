import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ResourceQuota } from '../../interfaces/resource-quota';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function ResourceQuotas() {
  const { data: quotas, error, loading } = useResource<ResourceQuota>('resourcequotas');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.namespace', header: 'NAMESPACE' },
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'resources',
        header: 'REQUEST (used/hard)',
        accessor: (row: ResourceQuota) => {
          const hard = row.status?.hard ?? {};
          const used = row.status?.used ?? {};
          const keys = Object.keys(hard).slice(0, 3);
          if (keys.length === 0) return '-';
          return keys.map((k) => `${k}: ${used[k] ?? 0}/${hard[k]}`).join(', ');
        },
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ResourceQuota) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ResourceQuota) => {
    if (actionId === 'edit') {
      setEditingResource({
        namespace: row.metadata.namespace,
        name: row.metadata.name,
      });
      setEditDrawerOpen(true);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );

  return (
    <PageLayout
      title="Resource Quotas"
      description="Real-time monitoring dashboard for resource quotas"
    >
      <ResourceTable config={config} data={quotas} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="ResourceQuota"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default ResourceQuotas;
