import type { ResourceTableConfig } from '../../interfaces/common';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Namespace } from '../../interfaces/namespace';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import { useResource } from '../../hooks/useResource';
import { useDeleteResource } from '../../hooks/useResource';
import ResourceDeleteConfirmDialog from '../../components/common/DeleteConfirmDialog/ResourceDeleteConfirmDialog';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function Namespaces() {
  const { data: namespaces, error, loading } = useResource<Namespace>('namespaces');
  const { deleteResouce, isDeleting } = useDeleteResource();

  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [describeOpen, setDescribeOpen] = useState(false);
  const [describeName, setDescribeName] = useState('');

  const namespaceConfig: ResourceTableConfig = {
    columns: [
      { key: 'metadata.name', header: 'NAME' },
      { key: 'status.phase', header: 'STATUS' },
      {
        key: 'age',
        header: 'AGE',
        accessor: (namespace: Namespace) => <ResourceLiveAge creationTimestamp={namespace.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
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
    <PageLayout title="Namespaces" description="Real-time monitoring dashboard for namespaces">
      <ResourceTable config={namespaceConfig} data={namespaces} onAction={handleAction} resourceType="namespaces" />
      {selectedNamespace && (
        <ResourceDeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          resourceName={selectedNamespace.metadata.name}
          resourceKind="Namespace"
          isDeleting={isDeleting}
        />
      )}
      <ResourceDescribeDrawer
        open={describeOpen}
        onClose={() => {
          setDescribeOpen(false);
          setDescribeName('');
        }}
        apiVersion="v1"
        kind="Namespace"
        namespace=""
        name={describeName}
      />
    </PageLayout>
  );
}

export default Namespaces;
