import { useNamespaces } from "../../hooks/useNamespaces";
import { ResourceTableConfig } from "../../interfaces/common";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { Namespace } from "../../interfaces/namespace";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageHeader from "../../components/common/PageHeader/PageHeader";

function Namespaces() {
  const { namespaces, error, loading } = useNamespaces();

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
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <PageHeader
        title="Namespaces"
        description="Real-time monitoring dashboard for namespaces"
      />

      <ResourceTable
        config={namespaceConfig}
        data={namespaces}
        onAction={handleAction}
        resourceType="namespaces"
      />
    </Box>
  );
}

export default Namespaces;
