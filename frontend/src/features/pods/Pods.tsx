import ResourceTable from "../../components/common/Table/ResourceTable";
import { useResource } from "../../hooks/useResource";
import { Pod } from "../../interfaces/pod";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleIcon from "@mui/icons-material/Article";
import TerminalIcon from "@mui/icons-material/Terminal";
import BiotechIcon from "@mui/icons-material/Biotech";
import {
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import { useState } from "react";
import PodExecDrawer from "../../components/drawer/PodExecDrawer";
import PodLogsDrawer from "../../components/drawer/PodLogsDrawer";
import PodDiagnosisDialog from "../../components/common/PodDiagnosisDialog/PodDiagnosisDialog";
import { useAgent } from "../../context/AgentContext";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";

// --- Helper Functions (Defined outside the component) ---

const getPodReadyStatus = (pod: Pod) => {
  if (!pod || !pod.status) {
    return "Unknown";
  }
  const total = pod?.spec?.containers?.length ?? 0;
  const ready =
    pod.status?.containerStatuses?.filter((c) => c.ready).length ?? 0;
  return `${ready}/${total}`;
};

const getPodStatus = (pod: Pod) => {
  const status = pod?.status?.phase;
  const total = pod?.spec?.containers?.length ?? 0;
  const ready =
    pod.status?.containerStatuses?.filter((c) => c.ready).length ?? 0;

  // 1. Terminating check
  if (pod.metadata?.deletionTimestamp) {
    return {
      kind: "status",
      label: "Terminating",
      cssClass: "border-red2",
    };
  }

  // 2. Running but not fully ready
  if (ready !== total && status === "Running") {
    return {
      kind: "status",
      label: "Running",
      cssClass: "border-not-ready-running",
    };
  }

  // 3. Standard statuses
  switch (status) {
    case "Running":
      return { kind: "status", label: "Running", cssClass: "success" };
    case "Failed":
      return { kind: "status", label: "Failed", cssClass: "error" };
    case "Pending":
      return { kind: "status", label: "Pending", cssClass: "warning" };
    case "Succeeded":
      return { kind: "status", label: "Completed", cssClass: "info" };
    default:
      return { kind: "status", label: "Unknown", cssClass: "info" };
  }
};

const getPodRestarts = (pod: Pod) => {
  const containers = pod?.status?.containerStatuses ?? [];
  return containers.reduce((sum, c) => sum + (c.restartCount || 0), 0);
};

const getPodCpuReq = (pod: Pod) => {
  const containers = pod.spec?.containers ?? [];
  const totalCpu = containers
    .map((c) => c.resources?.requests?.cpu || "ns")
    .join(", ");
  return totalCpu || "-";
};

const getPodMemReq = (pod: Pod) => {
  const containers = pod.spec?.containers ?? [];
  const totalMem = containers
    .map((c) => c.resources?.requests?.memory || "ns")
    .join(", ");
  return totalMem || "-";
};

// --- Main Component ---

function Pods() {
  const { data: pods, error, loading, socket } = useResource<Pod>("pods");
  const { isConfigured } = useAgent();

  const [execDialogOpen, setExecDialogOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState<{
    namespace: string;
    podName: string;
    containers: { name: string }[];
    defaultContainer?: string;
  } | null>(null);

  // Logs drawer state
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedLogPod, setSelectedLogPod] = useState<{
    namespace: string;
    podName: string;
    containers: { name: string }[];
    defaultContainer?: string;
  } | null>(null);

  // Edit drawer state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingPod, setEditingPod] = useState<{
    namespace: string;
    podName: string;
  } | null>(null);

  // Diagnosis dialog state
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [diagnosingPod, setDiagnosingPod] = useState<{
    namespace: string;
    podName: string;
  } | null>(null);

  const handleDiagnose = (pod: Pod) => {
    setDiagnosingPod({
      namespace: pod.metadata.namespace,
      podName: pod.metadata.name,
    });
    setDiagnosisOpen(true);
  };

  const podConfig: ResourceTableConfig = {
    columns: [
      { key: "metadata.namespace", header: "NAMESPACE" },
      { key: "metadata.name", header: "NAME" },
      {
        key: "ready",
        header: "READY",
        accessor: (row) => getPodReadyStatus(row),
      },
      {
        key: "status",
        header: "STATUS",
        accessor: (row) => getPodStatus(row),
      },
      {
        key: "restarts",
        header: "RESTARTS",
        accessor: (row) => getPodRestarts(row),
      },
      {
        key: "cpu",
        header: "CPU Req",
        accessor: (row) => getPodCpuReq(row),
      },
      {
        key: "mem",
        header: "MEM Req",
        accessor: (row) => getPodMemReq(row),
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
      { key: "spec.nodeName", header: "NODE" },
      {
        key: "diagnose",
        header: "DXG",
        accessor: (row: Pod) => (
          <Tooltip title="" placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDiagnose(row);
              }}
              //sx={{
              //  color: "primary.main",
              //  filter:
              //    "drop-shadow(0 0 0.5px #ffffffff) drop-shadow(0 0 1px #ffffffff)",
              //"&:hover": {
              //  color: "primary.main",
              //  bgcolor: "primary.main" + "14",
              //},
              //}}
            >
              <BiotechIcon
                sx={{
                  color: isConfigured ? "primary.main" : "#fff",
                  filter: isConfigured
                    ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
      { id: "logs", label: "Logs", icon: ArticleIcon },
      { id: "exec", label: "Exec", icon: TerminalIcon },
    ],
  };

  const deleteResource = async (namespace: string, podName: string) => {
    try {
      const res = await fetch(
        `http://localhost:3030/api/resource?apiVersion=${encodeURIComponent("v1")}&kind=${encodeURIComponent("Pod")}&namespace=${encodeURIComponent(namespace)}&name=${encodeURIComponent(podName)}`,
        {
          method: "DELETE",
        },
      );

      console.log(await res.text());
    } catch (err) {
      console.error("Error deleting resource:", err);
    }
  };

  const handleAction = (actionId: string, pod: Pod) => {
    const namespace = pod.metadata.namespace;
    const podName = pod.metadata.name;
    const containers =
      pod.spec.containers?.map((c) => ({
        name: c.name,
      })) || [];
    const defaultContainer = containers[0]?.name;

    if (actionId === "edit") {
      setEditingPod({ namespace, podName });
      setEditDrawerOpen(true);
    }
    if (actionId === "delete") {
      if (window.confirm(`Are you sure you want to delete pod ${podName}?`)) {
        deleteResource(namespace, podName);
      }
    }
    if (actionId === "logs") {
      setSelectedLogPod({ namespace, podName, containers, defaultContainer });
      setLogsDialogOpen(true);
    }
    if (actionId === "exec") {
      setSelectedPod({ namespace, podName, containers, defaultContainer });
      setExecDialogOpen(true);
    }
  };

  const handleCloseExecDialog = () => {
    setExecDialogOpen(false);
    setSelectedPod(null);
  };

  const handleCloseLogsDialog = () => {
    setLogsDialogOpen(false);
    setSelectedLogPod(null);
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
      title="Pods"
      description="Real-time monitoring dashboard for pods"
    >
      <ResourceTable config={podConfig} data={pods} onAction={handleAction} />
      {selectedPod && (
        <PodExecDrawer
          open={execDialogOpen}
          onClose={handleCloseExecDialog}
          namespace={selectedPod.namespace}
          podName={selectedPod.podName}
          containers={selectedPod.containers}
          defaultContainer={selectedPod.defaultContainer}
          socket={socket}
        />
      )}
      {selectedLogPod && (
        <PodLogsDrawer
          open={logsDialogOpen}
          onClose={handleCloseLogsDialog}
          namespace={selectedLogPod.namespace}
          podName={selectedLogPod.podName}
          containers={selectedLogPod.containers}
          defaultContainer={selectedLogPod.defaultContainer}
          socket={socket}
        />
      )}

      {editingPod && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingPod(null);
          }}
          apiVersion="v1"
          kind="Pod"
          namespace={editingPod.namespace}
          name={editingPod.podName}
        />
      )}

      {/* AI Diagnosis Dialog */}
      {diagnosingPod && (
        <PodDiagnosisDialog
          open={diagnosisOpen}
          onClose={() => {
            setDiagnosisOpen(false);
            setDiagnosingPod(null);
          }}
          namespace={diagnosingPod.namespace}
          podName={diagnosingPod.podName}
        />
      )}
    </PageLayout>
  );
}

export default Pods;
