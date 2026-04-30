import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ConfigMap } from '../../interfaces/config-map';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function ConfigMaps() {
  const { data: configMaps, error, loading } = useResource<ConfigMap>('configmaps');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);
  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeResource, setDescribeResource] = useState<{ namespace: string; name: string } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.namespace', header: 'NAMESPACE' },
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'data',
        header: 'DATA',
        accessor: (row: ConfigMap) => Object.keys(row.data ?? {}).length + Object.keys(row.binaryData ?? {}).length,
      },
      {
        key: 'immutable',
        header: 'IMMUTABLE',
        accessor: (row: ConfigMap) => (row.immutable ? 'True' : '-'),
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ConfigMap) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
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
    } else if (actionId === 'describe') {
      setDescribeResource({ namespace: row.metadata.namespace, name: row.metadata.name });
      setDescribeOpen(true);
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
    <PageLayout title="ConfigMaps" description="Real-time monitoring dashboard for config maps">
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
      <ResourceDescribeDrawer
        open={describeOpen}
        onClose={() => {
          setDescribeOpen(false);
          setDescribeResource(null);
        }}
        apiVersion="v1"
        kind="ConfigMap"
        namespace={describeResource?.namespace ?? ''}
        name={describeResource?.name ?? ''}
      />
    </PageLayout>
  );
}

export default ConfigMaps;
