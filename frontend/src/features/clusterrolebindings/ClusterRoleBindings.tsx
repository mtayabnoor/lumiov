import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ClusterRoleBinding } from '../../interfaces/role-binding';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function ClusterRoleBindings() {
  const { data: bindings, error, loading } = useResource<ClusterRoleBinding>('clusterrolebindings');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    name: string;
  } | null>(null);
  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeName, setDescribeName] = useState('');

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'role',
        header: 'ROLE',
        accessor: (row: ClusterRoleBinding) => `${row.roleRef.kind}/${row.roleRef.name}`,
      },
      {
        key: 'subjects',
        header: 'SUBJECTS',
        accessor: (row: ClusterRoleBinding) => row.subjects?.length ?? 0,
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ClusterRoleBinding) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ClusterRoleBinding) => {
    if (actionId === 'edit') {
      setEditingResource({ name: row.metadata.name });
      setEditDrawerOpen(true);
    } else if (actionId === 'describe') {
      setDescribeName(row.metadata.name);
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
    <PageLayout title="Cluster Role Bindings" description="Real-time monitoring dashboard for cluster role bindings">
      <ResourceTable config={config} data={bindings} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="rbac.authorization.k8s.io/v1"
          kind="ClusterRoleBinding"
          namespace=""
          name={editingResource.name}
        />
      )}
      <ResourceDescribeDrawer
        open={describeOpen}
        onClose={() => {
          setDescribeOpen(false);
          setDescribeName('');
        }}
        apiVersion="rbac.authorization.k8s.io/v1"
        kind="ClusterRoleBinding"
        namespace=""
        name={describeName}
      />
    </PageLayout>
  );
}

export default ClusterRoleBindings;
