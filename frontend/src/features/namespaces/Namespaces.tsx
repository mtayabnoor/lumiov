import type { ResourceTableConfig } from "../../interfaces/common";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { Namespace } from "../../interfaces/namespace";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import { useResource } from "../../hooks/useResource";

function Namespaces() {
  const {
    data: namespaces,
    error,
    loading,
  } = useResource<Namespace>("namespaces");

  const namespaceConfig: ResourceTableConfig = {
    columns: [
      { key: "metadata.name", header: "NAME" },
      {
        key: "age",
        header: "AGE",
        accessor: (namespace: Namespace) => (
          <ResourceLiveAge
            creationTimestamp={namespace.metadata.creationTimestamp}
          />
        ),
      },
    ],
    actions: [{ id: "delete", label: "Delete", icon: DeleteIcon }],
  };

  const handleAction = (actionId: string, row: any) => {
    console.log("Action triggered:", actionId, row);
    // Add logic: e.g., navigate to logs, open delete dialog, etc.
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
      title="Namespaces"
      description="Real-time monitoring dashboard for namespaces"
    >
      <ResourceTable
        config={namespaceConfig}
        data={namespaces}
        onAction={handleAction}
        resourceType="namespaces"
      />
    </PageLayout>
  );
}

export default Namespaces;
