import { useDeployments } from "../../hooks/useDeployments";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { Deployment } from "../../interfaces/deployment";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageHeader from "../../components/common/PageHeader/PageHeader";

const getDeploymentReadyStatus = (event: Deployment) => {
  const desired = event?.status?.replicas ?? 0;
  const ready = event?.status?.readyReplicas ?? 0;
  return `${ready}/${desired}`;
};

function Deployments() {
  const { deployments, error, loading } = useDeployments();

  const deploymentConfig: ResourceTableConfig = {
    columns: [
      { key: "metadata.namespace", header: "NAMESPACE" },
      { key: "metadata.name", header: "NAME" },
      {
        key: "status.numberReady",
        header: "READY",
        accessor: (row: any) => getDeploymentReadyStatus(row),
      },
      { key: "status.updatedReplicas", header: "UP-TO-DATE" },
      { key: "status.availableReplicas", header: "AVAILABLE" },
      {
        key: "age",
        header: "AGE",
        accessor: (deployment: Deployment) => (
          <ResourceLiveAge
            creationTimestamp={deployment.metadata.creationTimestamp}
          />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
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
        p: 2,
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <PageHeader
        title="Deployments"
        description="Real-time monitoring dashboard for deployments"
      />

      <ResourceTable
        config={deploymentConfig}
        data={deployments}
        onAction={handleAction}
      />
    </Box>
  );
}

export default Deployments;
