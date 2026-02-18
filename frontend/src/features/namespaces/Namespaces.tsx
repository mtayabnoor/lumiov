import type { ResourceTableConfig } from '../../interfaces/common';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Namespace } from '../../interfaces/namespace';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import { useResource } from '../../hooks/useResource';
import { useDeleteResource } from '../../hooks/useResource';
import ResourceDeleteConfirmDialog from '../../components/common/DeleteConfirmDialog/ResourceDeleteConfirmDialog';
import { useState } from 'react';

function Namespaces() {
  const { data: namespaces, error, loading } = useResource<Namespace>('namespaces');
  const { deleteResouce, isDeleting } = useDeleteResource();

  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const namespaceConfig: ResourceTableConfig = {
    columns: [
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'age',
        header: 'AGE',
        accessor: (namespace: Namespace) => (
          <ResourceLiveAge creationTimestamp={namespace.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [{ id: 'delete', label: 'Delete', icon: DeleteIcon }],
  };

  const confirmDelete = () => {
    if (selectedNamespace) {
      deleteResouce({
        apiVersion: 'v1',
        kind: 'Namespace',
        name: selectedNamespace.metadata.name,
      });
    }

    setSelectedNamespace(null);
    setDeleteDialogOpen(false);
  };

  const handleAction = (actionId: string, row: any) => {
    setSelectedNamespace(row);
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
    <PageLayout
      title="Namespaces"
      description="Real-time monitoring dashboard for namespaces"
    >
      <ResourceTable
        config={namespaceConfig}
        data={namespaces}
        onAction={handleAction}
        resourceType="namespaces"
      />
      {/* The Dialog Component - Renders only when podToDelete is set */}
      <ResourceDeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        resourceName={selectedNamespace!.metadata.name}
        resourceKind="Namespace"
        isDeleting={isDeleting}
      />
    </PageLayout>
  );
}

export default Namespaces;
