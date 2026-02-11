import { useResource } from "../../hooks/useResource";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { Deployment } from "../../interfaces/deployment";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

const getDeploymentReadyStatus = (event: Deployment) => {
  const desired = event?.status?.replicas ?? 0;
  const ready = event?.status?.readyReplicas ?? 0;
  return `${ready}/${desired}`;
};

function Deployments() {
  const {
    data: deployments,
    error,
    loading,
  } = useResource<Deployment>("deployments");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<{
    namespace: string;
    deploymentName: string;
  } | null>(null);

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

  const handleAction = (actionId: string, deployment: Deployment) => {
    const namespace = deployment.metadata.namespace;
    const deploymentName = deployment.metadata.name;

    if (actionId === "edit") {
      setEditingDeployment({ namespace, deploymentName });
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
      title="Deployments"
      description="Real-time monitoring dashboard for deployments"
    >
      <ResourceTable
        config={deploymentConfig}
        data={deployments}
        onAction={handleAction}
      />
      {editingDeployment && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingDeployment(null);
          }}
          apiVersion="apps/v1"
          kind="Deployment"
          namespace={editingDeployment.namespace}
          name={editingDeployment.deploymentName}
        />
      )}
    </PageLayout>
  );
}

export default Deployments;
