import type { ResourceTableConfig } from '../../interfaces/common';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Namespace } from '../../interfaces/namespace';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import { useResource } from '../../hooks/useResource';

function Namespaces() {
  const { data: namespaces, error, loading } = useResource<Namespace>('namespaces');

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

  const deleteResource = async (namespace: string, resourceName: string) => {
    try {
      const res = await fetch(
        `http://localhost:3030/api/resource?apiVersion=${encodeURIComponent('v1')}&kind=${encodeURIComponent('Namespace')}&namespace=${encodeURIComponent(namespace)}&name=${encodeURIComponent(resourceName)}`,
        {
          method: 'DELETE',
        },
      );

      console.log(await res.text());
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  const handleAction = (actionId: string, row: any) => {
    const namespace = row.metadata.namespace;
    const resourceName = row.metadata.name;
    if (actionId === 'delete') {
      if (window.confirm(`Are you sure you want to delete namespace ${resourceName}?`)) {
        deleteResource(namespace, resourceName);
      }
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
    </PageLayout>
  );
}

export default Namespaces;
