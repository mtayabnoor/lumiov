import { useDeployment } from "./useDeployment";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { WatchResourcePayload } from "../../interfaces/socket";
import { Deployment } from "../../interfaces/deployment";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";

const getDeploymentReadyStatus = (event: WatchResourcePayload<Deployment>) => {
  const desired = event?.object?.status?.replicas ?? 0;
  const ready = event?.object?.status?.readyReplicas ?? 0;
  return `${ready}/${desired}`;
};

function Deployments() {
  const { deployments, error, loading } = useDeployment();

  const podConfig: ResourceTableConfig = {
    columns: [
      { key: "object.metadata.namespace", header: "NAMESPACE" },
      { key: "object.metadata.name", header: "NAME" },
      {
        key: "object.status.numberReady",
        header: "READY",
        accessor: (row: any) => getDeploymentReadyStatus(row),
      },
      { key: "object.status.updatedReplicas", header: "UP-TO-DATE" },
      { key: "object.status.availableReplicas", header: "AVAILABLE" },
      {
        key: "age",
        header: "AGE",
        accessor: (row: any) => (
          <ResourceLiveAge
            creationTimestamp={row.object.metadata.creationTimestamp}
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
    <ResourceTable
      config={podConfig}
      data={deployments}
      onAction={handleAction}
    />
  );
}

export default Deployments;
