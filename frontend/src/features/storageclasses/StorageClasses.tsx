import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { StorageClass } from '../../interfaces/storage-class';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function StorageClasses() {
  const {
    data: storageClasses,
    error,
    loading,
  } = useResource<StorageClass>('storageclasses');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.name', header: 'NAME' },
      { key: 'provisioner', header: 'PROVISIONER' },
      {
        key: 'reclaimPolicy',
        header: 'RECLAIM POLICY',
        accessor: (row: StorageClass) => row.reclaimPolicy ?? 'Delete',
      },
      {
        key: 'volumeBindingMode',
        header: 'VOLUME BINDING MODE',
        accessor: (row: StorageClass) => row.volumeBindingMode ?? 'Immediate',
      },
      {
        key: 'allowExpansion',
        header: 'ALLOW EXPANSION',
        accessor: (row: StorageClass) => (row.allowVolumeExpansion ? 'True' : 'False'),
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: StorageClass) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: StorageClass) => {
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
      title="Storage Classes"
      description="Real-time monitoring dashboard for storage classes"
    >
      <ResourceTable config={config} data={storageClasses} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="storage.k8s.io/v1"
          kind="StorageClass"
          namespace=""
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default StorageClasses;
