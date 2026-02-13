import { useResource } from "../../hooks/useResource";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { PersistentVolume } from "../../interfaces/persistent-volume";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

const getPvStatus = (pv: PersistentVolume) => {
  const phase = pv.status?.phase;
  switch (phase) {
    case "Available":
      return { kind: "status", label: "Available", cssClass: "success" };
    case "Bound":
      return { kind: "status", label: "Bound", cssClass: "success" };
    case "Released":
      return { kind: "status", label: "Released", cssClass: "warning" };
    case "Failed":
      return { kind: "status", label: "Failed", cssClass: "error" };
    default:
      return { kind: "status", label: phase || "Pending", cssClass: "info" };
  }
};

function PersistentVolumes() {
  const {
    data: pvs,
    error,
    loading,
  } = useResource<PersistentVolume>("persistentvolumes");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: "metadata.name", header: "NAME" },
      {
        key: "capacity",
        header: "CAPACITY",
        accessor: (row: PersistentVolume) => row.spec?.capacity?.storage ?? "-",
      },
      {
        key: "accessModes",
        header: "ACCESS MODES",
        accessor: (row: PersistentVolume) =>
          row.spec?.accessModes?.join(", ") ?? "-",
      },
      {
        key: "reclaimPolicy",
        header: "RECLAIM POLICY",
        accessor: (row: PersistentVolume) =>
          row.spec?.persistentVolumeReclaimPolicy ?? "-",
      },
      {
        key: "status",
        header: "STATUS",
        accessor: (row: PersistentVolume) => getPvStatus(row),
      },
      {
        key: "claim",
        header: "CLAIM",
        accessor: (row: PersistentVolume) => {
          const ref = row.spec?.claimRef;
          if (!ref) return "-";
          return `${ref.namespace}/${ref.name}`;
        },
      },
      { key: "spec.storageClassName", header: "STORAGE CLASS" },
      {
        key: "age",
        header: "AGE",
        accessor: (row: PersistentVolume) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: PersistentVolume) => {
    if (actionId === "edit") {
      setEditingResource({ name: row.metadata.name });
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
      title="Persistent Volumes"
      description="Real-time monitoring dashboard for persistent volumes"
    >
      <ResourceTable config={config} data={pvs} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="PersistentVolume"
          namespace=""
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default PersistentVolumes;
