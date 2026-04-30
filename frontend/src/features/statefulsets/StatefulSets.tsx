import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { StatefulSet } from '../../interfaces/stateful-set';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function StatefulSets() {
  const { data: statefulSets, error, loading } = useResource<StatefulSet>('statefulsets');

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
        key: 'ready',
        header: 'READY',
        accessor: (row: StatefulSet) => {
          const desired = row.spec?.replicas ?? 0;
          const ready = row.status?.readyReplicas ?? 0;
          return `${ready}/${desired}`;
        },
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: StatefulSet) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: StatefulSet) => {
    if (actionId === 'describe') {
      setDescribeResource({ namespace: row.metadata.namespace, name: row.metadata.name });
      setDescribeOpen(true);
    }
    if (actionId === 'edit') {
      setEditingResource({
        namespace: row.metadata.namespace,
        name: row.metadata.name,
      });
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
    <PageLayout title="StatefulSets" description="Real-time monitoring dashboard for statefulsets">
      <ResourceTable config={config} data={statefulSets} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="apps/v1"
          kind="StatefulSet"
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
        apiVersion="apps/v1"
        kind="StatefulSet"
        namespace={describeResource?.namespace ?? ''}
        name={describeResource?.name ?? ''}
      />
    </PageLayout>
  );
}

export default StatefulSets;
