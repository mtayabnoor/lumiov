import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { CronJob } from "../../interfaces/cron-job";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function CronJobs() {
  const { data: cronJobs, error, loading } = useResource<CronJob>("cronjobs");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<{
    namespace: string;
    name: string;
  } | null>(null);

  const config: ResourceTableConfig = {
    columns: [
      { key: "metadata.namespace", header: "NAMESPACE" },
      { key: "metadata.name", header: "NAME" },
      { key: "spec.schedule", header: "SCHEDULE" },
      {
        key: "suspend",
        header: "SUSPEND",
        accessor: (row: CronJob) => (row.spec?.suspend ? "True" : "False"),
      },
      {
        key: "active",
        header: "ACTIVE",
        accessor: (row: CronJob) => row.status?.active?.length ?? 0,
      },
      {
        key: "lastSchedule",
        header: "LAST SCHEDULE",
        accessor: (row: CronJob) => {
          if (!row.status?.lastScheduleTime) return "-";
          return (
            <ResourceLiveAge creationTimestamp={row.status.lastScheduleTime} />
          );
        },
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: CronJob) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: CronJob) => {
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
      title="CronJobs"
      description="Real-time monitoring dashboard for cronjobs"
    >
      <ResourceTable config={config} data={cronJobs} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="batch/v1"
          kind="CronJob"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default CronJobs;
