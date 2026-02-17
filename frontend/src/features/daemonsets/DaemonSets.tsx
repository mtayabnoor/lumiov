import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { DaemonSet } from "../../interfaces/daemon-set";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function DaemonSets() {
  const {
    data: daemonSets,
    error,
    loading,
  } = useResource<DaemonSet>("daemonsets");

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
        accessor: (row: DaemonSet) => row.status?.desiredNumberScheduled ?? 0,
      },
      {
        key: "current",
        header: "CURRENT",
        accessor: (row: DaemonSet) => row.status?.currentNumberScheduled ?? 0,
      },
      {
        key: "ready",
        header: "READY",
        accessor: (row: DaemonSet) => row.status?.numberReady ?? 0,
      },
      {
        key: "available",
        header: "AVAILABLE",
        accessor: (row: DaemonSet) => row.status?.numberAvailable ?? 0,
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: DaemonSet) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: DaemonSet) => {
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
      title="DaemonSets"
      description="Real-time monitoring dashboard for daemonsets"
    >
      <ResourceTable
        config={config}
        data={daemonSets}
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
          kind="DaemonSet"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default DaemonSets;
