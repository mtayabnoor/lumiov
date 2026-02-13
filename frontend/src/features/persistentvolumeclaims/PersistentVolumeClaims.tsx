import { useResource } from "../../hooks/useResource";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { PersistentVolumeClaim } from "../../interfaces/persistent-volume-claim";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

const getPvcStatus = (pvc: PersistentVolumeClaim) => {
  const phase = pvc.status?.phase;
  switch (phase) {
    case "Bound":
      return { kind: "status", label: "Bound", cssClass: "success" };
    case "Pending":
      return { kind: "status", label: "Pending", cssClass: "warning" };
    case "Lost":
      return { kind: "status", label: "Lost", cssClass: "error" };
    default:
      return { kind: "status", label: phase || "Unknown", cssClass: "info" };
  }
};

function PersistentVolumeClaims() {
  const {
    data: pvcs,
    error,
    loading,
  } = useResource<PersistentVolumeClaim>("persistentvolumeclaims");

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
        key: "status",
        header: "STATUS",
        accessor: (row: PersistentVolumeClaim) => getPvcStatus(row),
      },
      { key: "spec.volumeName", header: "VOLUME" },
      {
        key: "capacity",
        header: "CAPACITY",
        accessor: (row: PersistentVolumeClaim) =>
          row.status?.capacity?.storage ?? "-",
      },
      {
        key: "accessModes",
        header: "ACCESS MODES",
        accessor: (row: PersistentVolumeClaim) =>
          row.status?.accessModes?.join(", ") ??
          row.spec?.accessModes?.join(", ") ??
          "-",
      },
      { key: "spec.storageClassName", header: "STORAGE CLASS" },
      {
        key: "age",
        header: "AGE",
        accessor: (row: PersistentVolumeClaim) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: PersistentVolumeClaim) => {
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
      title="Persistent Volume Claims"
      description="Real-time monitoring dashboard for persistent volume claims"
    >
      <ResourceTable config={config} data={pvcs} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="PersistentVolumeClaim"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default PersistentVolumeClaims;
