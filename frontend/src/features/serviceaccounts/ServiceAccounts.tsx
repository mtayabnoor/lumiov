import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { ServiceAccount } from '../../interfaces/service-account';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function ServiceAccounts() {
  const { data: serviceAccounts, error, loading } = useResource<ServiceAccount>('serviceaccounts');

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
        key: 'secrets',
        header: 'SECRETS',
        accessor: (row: ServiceAccount) => row.secrets?.length ?? 0,
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: ServiceAccount) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ServiceAccount) => {
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
    <PageLayout title="Service Accounts" description="Real-time monitoring dashboard for service accounts">
      <ResourceTable config={config} data={serviceAccounts} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="ServiceAccount"
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
        kind="ServiceAccount"
        namespace={describeResource?.namespace ?? ''}
        name={describeResource?.name ?? ''}
      />
    </PageLayout>
  );
}

export default ServiceAccounts;
