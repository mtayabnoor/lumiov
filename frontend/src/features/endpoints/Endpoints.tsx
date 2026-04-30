import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Endpoints } from '../../interfaces/endpoint';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function EndpointsPage() {
  const { data: endpoints, error, loading } = useResource<Endpoints>('endpoints');

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
        key: 'endpoints',
        header: 'ENDPOINTS',
        accessor: (row: Endpoints) => {
          if (!row.subsets?.length) return '<none>';
          const addresses = row.subsets.flatMap((s) => s.addresses?.map((a) => a.ip) ?? []);
          if (addresses.length === 0) return '<none>';
          if (addresses.length <= 3) return addresses.join(', ');
          return `${addresses.slice(0, 3).join(', ')} + ${addresses.length - 3} more`;
        },
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: Endpoints) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: Endpoints) => {
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
    <PageLayout title="Endpoints" description="Real-time monitoring dashboard for endpoints">
      <ResourceTable config={config} data={endpoints} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="Endpoints"
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
        kind="Endpoints"
        namespace={describeResource?.namespace ?? ''}
        name={describeResource?.name ?? ''}
      />
    </PageLayout>
  );
}

export default EndpointsPage;
