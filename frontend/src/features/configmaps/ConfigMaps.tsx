import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ConfigMap } from '../../interfaces/config-map';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function ConfigMaps() {
  const { data: configMaps, error, loading } = useResource<ConfigMap>('configmaps');

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
        key: 'data',
        header: 'DATA',
        accessor: (row: ConfigMap) =>
          Object.keys(row.data ?? {}).length + Object.keys(row.binaryData ?? {}).length,
      },
      {
        key: 'immutable',
        header: 'IMMUTABLE',
        accessor: (row: ConfigMap) => (row.immutable ? 'True' : '-'),
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ConfigMap) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ConfigMap) => {
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
      title="ConfigMaps"
      description="Real-time monitoring dashboard for config maps"
    >
      <ResourceTable config={config} data={configMaps} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="ConfigMap"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default ConfigMaps;
