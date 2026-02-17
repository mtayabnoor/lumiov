import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { ReplicaSet } from "../../interfaces/replica-set";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function ReplicaSets() {
  const {
    data: replicaSets,
    error,
    loading,
  } = useResource<ReplicaSet>("replicasets");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: "metadata.namespace", header: "NAMESPACE" },
      { key: "metadata.name", header: "NAME" },
      {
        key: "desired",
        header: "DESIRED",
        accessor: (row: ReplicaSet) => row.spec?.replicas ?? 0,
      },
      {
        key: "current",
        header: "CURRENT",
        accessor: (row: ReplicaSet) => row.status?.replicas ?? 0,
      },
      {
        key: "ready",
        header: "READY",
        accessor: (row: ReplicaSet) => row.status?.readyReplicas ?? 0,
      },
      {
        key: "owner",
        header: "OWNER",
        accessor: (row: ReplicaSet) =>
          row.metadata?.ownerReferences?.[0]
            ? `${row.metadata.ownerReferences[0].kind}/${row.metadata.ownerReferences[0].name}`
            : "-",
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: ReplicaSet) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: ReplicaSet) => {
    if (actionId === "edit") {
      setEditingResource({
        namespace: row.metadata.namespace,
        name: row.metadata.name,
      });
      setEditDrawerOpen(true);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
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
      title="ReplicaSets"
      description="Real-time monitoring dashboard for replicasets"
    >
      <ResourceTable
        config={config}
        data={replicaSets}
        onAction={handleAction}
      />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="apps/v1"
          kind="ReplicaSet"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default ReplicaSets;
