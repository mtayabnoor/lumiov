import { useResource } from '../../hooks/useResource';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ResourceTable from '../../components/common/Table/ResourceTable';
import type { Ingress } from '../../interfaces/ingress';
import { Box, CircularProgress, Alert } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import { useState } from 'react';

function Ingresses() {
  const { data: ingresses, error, loading } = useResource<Ingress>('ingresses');

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: 'metadata.namespace', header: 'NAMESPACE' },
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'class',
        header: 'CLASS',
        accessor: (row: Ingress) => row.spec?.ingressClassName ?? '-',
      },
      {
        key: 'hosts',
        header: 'HOSTS',
        accessor: (row: Ingress) => {
          const hosts = row.spec?.rules?.map((r) => r.host).filter(Boolean);
          return hosts?.length ? hosts.join(', ') : '*';
        },
      },
      {
        key: 'address',
        header: 'ADDRESS',
        accessor: (row: Ingress) => {
          const ingress = row.status?.loadBalancer?.ingress;
          if (ingress?.length) return ingress.map((i) => i.ip || i.hostname).join(', ');
          return '-';
        },
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row: Ingress) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: Ingress) => {
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
    <PageLayout
      title="Ingresses"
      description="Real-time monitoring dashboard for ingresses"
    >
      <ResourceTable config={config} data={ingresses} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="networking.k8s.io/v1"
          kind="Ingress"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default Ingresses;
