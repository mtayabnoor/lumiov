import { useResource } from "../../hooks/useResource";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { Endpoints } from "../../interfaces/endpoint";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function EndpointsPage() {
  const {
    data: endpoints,
    error,
    loading,
  } = useResource<Endpoints>("endpoints");

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
        key: "endpoints",
        header: "ENDPOINTS",
        accessor: (row: Endpoints) => {
          if (!row.subsets?.length) return "<none>";
          const addresses = row.subsets.flatMap(
            (s) => s.addresses?.map((a) => a.ip) ?? [],
          );
          if (addresses.length === 0) return "<none>";
          if (addresses.length <= 3) return addresses.join(", ");
          return `${addresses.slice(0, 3).join(", ")} + ${addresses.length - 3} more`;
        },
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: Endpoints) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: Endpoints) => {
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
      title="Endpoints"
      description="Real-time monitoring dashboard for endpoints"
    >
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
    </PageLayout>
  );
}

export default EndpointsPage;
