import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ClusterRole } from '../../interfaces/role';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function ClusterRoles() {
  const { data: clusterRoles, error, loading } = useResource<ClusterRole>('clusterroles');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'rules',
        header: 'RULES',
        accessor: (row: ClusterRole) => row.rules?.length ?? 0,
      },
      {
        key: 'aggregation',
        header: 'AGGREGATION',
        accessor: (row: ClusterRole) => (row.aggregationRule ? 'Yes' : '-'),
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ClusterRole) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ClusterRole) => {
    if (actionId === 'edit') {
      setEditingResource({ name: row.metadata.name });
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
      title="Cluster Roles"
      description="Real-time monitoring dashboard for cluster roles"
    >
      <ResourceTable config={config} data={clusterRoles} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="rbac.authorization.k8s.io/v1"
          kind="ClusterRole"
          namespace=""
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default ClusterRoles;
