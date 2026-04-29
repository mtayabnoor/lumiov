import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Deployment } from '../../interfaces/deployment';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';
import { useDeleteResource } from '../../hooks/useResource';
import ResourceDeleteConfirmDialog from '../../components/common/DeleteConfirmDialog/ResourceDeleteConfirmDialog';

const getDeploymentReadyStatus = (event: Deployment) => {
  const desired = event?.status?.replicas ?? 0;
  const ready = event?.status?.readyReplicas ?? 0;
  return `${ready}/${desired}`;
};

function Deployments() {
  const { data: deployments, error, loading } = useResource<Deployment>('deployments');
  const { deleteResouce, isDeleting } = useDeleteResource();

  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deploymentConfig: ResourceTableConfig = {
    columns: [
      { key: 'metadata.namespace', header: 'NAMESPACE' },
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'status.numberReady',
        header: 'READY',
        accessor: (row: any) => getDeploymentReadyStatus(row),
      },
      { key: 'status.updatedReplicas', header: 'UP-TO-DATE' },
      { key: 'status.availableReplicas', header: 'AVAILABLE' },
      {
        key: 'age',
        header: 'AGE',
        accessor: (deployment: Deployment) => <ResourceLiveAge creationTimestamp={deployment.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const confirmDelete = () => {
    if (selectedDeployment) {
      deleteResouce({
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: selectedDeployment.metadata.name,
        namespace: selectedDeployment.metadata.namespace,
      });
    }

    setSelectedDeployment(null);
    setDeleteDialogOpen(false);
  };

  const handleAction = (actionId: string, deployment: Deployment) => {
    setSelectedDeployment(deployment);

    if (actionId === 'edit') {
      setEditDrawerOpen(true);
    }
    if (actionId === 'delete') {
      setDeleteDialogOpen(true);
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
    <PageLayout title="Deployments" description="Real-time monitoring dashboard for deployments">
      <ResourceTable config={deploymentConfig} data={deployments} onAction={handleAction} />
      {selectedDeployment && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setSelectedDeployment(null);
          }}
          apiVersion="apps/v1"
          kind="Deployment"
          namespace={selectedDeployment.metadata.namespace}
          name={selectedDeployment.metadata.name}
        />
      )}
      {selectedDeployment && (
        <ResourceDeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          resourceName={selectedDeployment.metadata.name}
          resourceKind="Deployment"
          isDeleting={isDeleting}
        />
      )}
    </PageLayout>
  );
}

export default Deployments;
