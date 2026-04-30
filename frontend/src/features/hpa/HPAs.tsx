import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { HorizontalPodAutoscaler } from '../../interfaces/hpa';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import { useState } from 'react';

function HPAs() {
  const { data: hpas, error, loading } = useResource<HorizontalPodAutoscaler>('horizontalpodautoscalers');

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
        key: 'reference',
        header: 'REFERENCE',
        accessor: (row: HorizontalPodAutoscaler) => {
          const ref = row.spec?.scaleTargetRef;
          return ref ? `${ref.kind}/${ref.name}` : '-';
        },
      },
      {
        key: 'targets',
        header: 'TARGETS',
        accessor: (row: HorizontalPodAutoscaler) => {
          const current = row.status?.currentCPUUtilizationPercentage ?? '<unknown>';
          const target = row.spec?.targetCPUUtilizationPercentage ?? '-';
          return `${current}%/${target}%`;
        },
      },
      {
        key: 'minpods',
        header: 'MINPODS',
        accessor: (row: HorizontalPodAutoscaler) => row.spec?.minReplicas ?? 1,
      },
      {
        key: 'maxpods',
        header: 'MAXPODS',
        accessor: (row: HorizontalPodAutoscaler) => row.spec?.maxReplicas ?? '-',
      },
      {
        key: 'replicas',
        header: 'REPLICAS',
        accessor: (row: HorizontalPodAutoscaler) => row.status?.currentReplicas ?? 0,
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: HorizontalPodAutoscaler) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: HorizontalPodAutoscaler) => {
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
    <PageLayout title="Horizontal Pod Autoscalers" description="Real-time monitoring dashboard for HPAs">
      <ResourceTable config={config} data={hpas} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="autoscaling/v1"
          kind="HorizontalPodAutoscaler"
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
        apiVersion="autoscaling/v1"
        kind="HorizontalPodAutoscaler"
        namespace={describeResource?.namespace ?? ''}
        name={describeResource?.name ?? ''}
      />
    </PageLayout>
  );
}

export default HPAs;
