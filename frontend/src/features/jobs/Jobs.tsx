import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { Job } from "../../interfaces/job";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

const getJobStatus = (job: Job) => {
  if ((job.status?.succeeded ?? 0) > 0)
    return { kind: "status", label: "Complete", cssClass: "success" };
  if ((job.status?.failed ?? 0) > 0)
    return { kind: "status", label: "Failed", cssClass: "error" };
  if ((job.status?.active ?? 0) > 0)
    return { kind: "status", label: "Running", cssClass: "warning" };
  return { kind: "status", label: "Pending", cssClass: "info" };
};

function Jobs() {
  const { data: jobs, error, loading } = useResource<Job>("jobs");

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
        accessor: (row: Job) => getJobStatus(row),
      },
      {
        key: "completions",
        header: "COMPLETIONS",
        accessor: (row: Job) => {
          const desired = row.spec?.completions ?? 1;
          const succeeded = row.status?.succeeded ?? 0;
          return `${succeeded}/${desired}`;
        },
      },
      {
        key: "duration",
        header: "DURATION",
        accessor: (row: Job) => {
          if (!row.status?.startTime) return "-";
          const start = new Date(row.status.startTime).getTime();
          const end = row.status.completionTime
            ? new Date(row.status.completionTime).getTime()
            : Date.now();
          const seconds = Math.floor((end - start) / 1000);
          if (seconds < 60) return `${seconds}s`;
          if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
          return `${Math.floor(seconds / 3600)}h`;
        },
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: Job) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: Job) => {
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
      title="Jobs"
      description="Real-time monitoring dashboard for jobs"
    >
      <ResourceTable config={config} data={jobs} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="batch/v1"
          kind="Job"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default Jobs;
