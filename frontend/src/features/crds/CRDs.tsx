import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { CustomResourceDefinition } from "../../interfaces/crd";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function CRDs() {
  const {
    data: crds,
    error,
    loading,
  } = useResource<CustomResourceDefinition>("customresourcedefinitions");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: "metadata.name", header: "NAME" },
      {
        key: "group",
        header: "GROUP",
        accessor: (row: CustomResourceDefinition) => row.spec?.group ?? "-",
      },
      {
        key: "kind",
        header: "KIND",
        accessor: (row: CustomResourceDefinition) =>
          row.spec?.names?.kind ?? "-",
      },
      {
        key: "scope",
        header: "SCOPE",
        accessor: (row: CustomResourceDefinition) => row.spec?.scope ?? "-",
      },
      {
        key: "versions",
        header: "VERSIONS",
        accessor: (row: CustomResourceDefinition) =>
          row.spec?.versions
            ?.filter((v) => v.served)
            .map((v) => v.name)
            .join(", ") ?? "-",
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: CustomResourceDefinition) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: CustomResourceDefinition) => {
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
      title="Custom Resource Definitions"
      description="Real-time monitoring dashboard for CRDs"
    >
      <ResourceTable config={config} data={crds} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="apiextensions.k8s.io/v1"
          kind="CustomResourceDefinition"
          namespace=""
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default CRDs;
