import ResourceTable from '../../components/common/Table/ResourceTable';
import { useResource, useDeleteResource } from '../../hooks/useResource';
import type { Pod } from '../../interfaces/pod';
import type { ResourceTableConfig } from '../../interfaces/common';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Box, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import ResourceLiveAge from '../../components/common/ResourceLiveAge/ResourceLiveAge';
import { useState } from 'react';
import PodExecDrawer from '../../components/drawer/PodExecDrawer';
import PodLogsDrawer from '../../components/drawer/PodLogsDrawer';
import PodPortForwardDrawer from '../../components/drawer/PodPortForwardDrawer';
import InfoIcon from '@mui/icons-material/Info';
import ResourceDescribeDrawer from '../../components/common/ResourceDescribeDrawer/ResourceDescribeDrawer';
import PodDiagnosisDialog from '../../components/common/PodDiagnosisDialog/PodDiagnosisDialog';
import { useAgent } from '../../context/AgentContext';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import ResourceEditor from '../../components/common/Editor/ResourceEditor';
import ResourceDeleteConfirmDialog from '../../components/common/DeleteConfirmDialog/ResourceDeleteConfirmDialog';
// --- Helper Functions (Defined outside the component) ---

const getPodReadyStatus = (pod: Pod) => {
  if (!pod || !pod.status) {
    return 'Unknown';
  }
  const total = pod?.spec?.containers?.length ?? 0;
  const ready = pod.status?.containerStatuses?.filter((c) => c.ready).length ?? 0;
  return `${ready}/${total}`;
};

const getPodStatus = (pod: Pod) => {
  const phase = pod?.status?.phase;

  // 1. Terminating check (deletionTimestamp set)
  if (pod.metadata?.deletionTimestamp) {
    return { kind: 'status', label: 'Terminating', cssClass: 'border-red2' };
  }

  // 2. Derive real status from container states (like kubectl does)
  const containerStatuses = pod.status?.containerStatuses ?? [];
  const initStatuses = pod.status?.initContainerStatuses ?? [];

  // Check init containers first
  for (const init of initStatuses) {
    if (init.state?.waiting?.reason) {
      return {
        kind: 'status',
        label: `Init:${init.state.waiting.reason}`,
        cssClass: getStatusCssClass(`Init:${init.state.waiting.reason}`),
      };
    }
    if (init.state?.terminated && init.state.terminated.exitCode !== 0) {
      return {
        kind: 'status',
        label: `Init:Error`,
        cssClass: 'error',
      };
    }
  }

  // Check regular containers — waiting/terminated reasons take priority
  for (const cs of containerStatuses) {
    // Waiting state: CrashLoopBackOff, ImagePullBackOff, ErrImagePull, etc.
    if (cs.state?.waiting?.reason) {
      return {
        kind: 'status',
        label: cs.state.waiting.reason,
        cssClass: getStatusCssClass(cs.state.waiting.reason),
      };
    }
    // Terminated state: OOMKilled, Error, Completed, etc.
    if (cs.state?.terminated?.reason) {
      return {
        kind: 'status',
        label: cs.state.terminated.reason,
        cssClass: getStatusCssClass(cs.state.terminated.reason),
      };
    }
    // Terminated with no reason — use exit code
    if (cs.state?.terminated) {
      const label = cs.state.terminated.exitCode === 0 ? 'Completed' : 'Error';
      return {
        kind: 'status',
        label,
        cssClass: cs.state.terminated.exitCode === 0 ? 'info' : 'error',
      };
    }
  }

  // 3. Check for not-ready running containers
  const total = pod?.spec?.containers?.length ?? 0;
  const ready = containerStatuses.filter((c) => c.ready).length;
  if (ready !== total && phase === 'Running') {
    return {
      kind: 'status',
      label: 'Running',
      cssClass: 'border-not-ready-running',
    };
  }

  // 4. Fall back to pod phase
  switch (phase) {
    case 'Running':
      return { kind: 'status', label: 'Running', cssClass: 'success' };
    case 'Failed':
      return { kind: 'status', label: 'Failed', cssClass: 'error' };
    case 'Pending':
      return { kind: 'status', label: 'Pending', cssClass: 'warning' };
    case 'Succeeded':
      return { kind: 'status', label: 'Completed', cssClass: 'info' };
    default:
      return { kind: 'status', label: phase || 'Unknown', cssClass: 'info' };
  }
};

// Map container state reasons to visual styles
const getStatusCssClass = (reason: string): string => {
  switch (reason) {
    case 'CrashLoopBackOff':
      return 'error';
    case 'OOMKilled':
      return 'error';
    case 'Error':
      return 'error';
    case 'ImagePullBackOff':
    case 'ErrImagePull':
    case 'InvalidImageName':
      return 'error';
    case 'CreateContainerConfigError':
    case 'RunContainerError':
      return 'error';
    case 'ContainerCreating':
    case 'PodInitializing':
      return 'warning';
    case 'Completed':
      return 'info';
    default:
      // Init:* reasons or anything unknown
      if (reason.startsWith('Init:')) return 'warning';
      return 'warning';
  }
};

const getPodRestarts = (pod: Pod) => {
  const containers = pod?.status?.containerStatuses ?? [];
  return containers.reduce((sum, c) => sum + (c.restartCount || 0), 0);
};

const getPodCpuReq = (pod: Pod) => {
  const containers = pod.spec?.containers ?? [];
  const totalCpu = containers.map((c) => c.resources?.requests?.cpu || 'ns').join(', ');
  return totalCpu || '-';
};

const getPodMemReq = (pod: Pod) => {
  const containers = pod.spec?.containers ?? [];
  const totalMem = containers.map((c) => c.resources?.requests?.memory || 'ns').join(', ');
  return totalMem || '-';
};

// --- Main Component ---

function Pods() {
  const { data: pods, error, loading, socket } = useResource<Pod>('pods');
  const { deleteResouce, isDeleting } = useDeleteResource();
  const { isConfigured } = useAgent();

  const [selectedPod, setSelectedPod] = useState<{
    namespace: string;
    podName: string;
    containers?: { name: string }[];
    defaultContainer?: string;
    ports: number[];
  } | null>(null);
  const [actionType, setActionType] = useState<'exec' | 'logs' | 'port-forward' | 'edit' | 'diagnosis' | 'delete' | 'describe' | null>(null);

  // Helper to set pod as selected and action
  const selectPodForAction = (pod: Pod, action: typeof actionType) => {
    const namespace = pod.metadata.namespace;
    const podName = pod.metadata.name;
    const containers =
      pod.spec.containers?.map((c) => ({
        name: c.name,
      })) || [];

    const ports = Array.from(
      new Set(
        (pod.spec.containers || []).flatMap((container) =>
          ((container as unknown as { ports?: Array<{ containerPort?: number }> }).ports || []).map((p) => p.containerPort).filter((p): p is number => typeof p === 'number'),
        ),
      ),
    ).sort((a, b) => a - b);

    const defaultContainer = containers[0]?.name;
    setSelectedPod({ namespace, podName, containers, defaultContainer, ports });
    setActionType(action);
  };

  const podConfig: ResourceTableConfig = {
    columns: [
      { key: 'metadata.namespace', header: 'NAMESPACE' },
      { key: 'metadata.name', header: 'NAME' },
      {
        key: 'ready',
        header: 'READY',
        accessor: (row) => getPodReadyStatus(row),
        sortValue: (row) => {
          const total = row?.spec?.containers?.length ?? 0;
          const ready = row?.status?.containerStatuses?.filter((c: any) => c.ready).length ?? 0;
          return total > 0 ? ready / total : 0;
        },
      },
      {
        key: 'status',
        header: 'STATUS',
        accessor: (row) => getPodStatus(row),
        sortValue: (row) => {
          const s = getPodStatus(row);
          return typeof s === 'object' && s !== null && 'label' in s ? (s as any).label : String(s);
        },
      },
      {
        key: 'restarts',
        header: 'RESTARTS',
        accessor: (row) => getPodRestarts(row),
        sortValue: (row) => getPodRestarts(row),
      },
      {
        key: 'cpu',
        header: 'CPU Req',
        accessor: (row) => getPodCpuReq(row),
        sortValue: (row) => getPodCpuReq(row),
      },
      {
        key: 'mem',
        header: 'MEM Req',
        accessor: (row) => getPodMemReq(row),
        sortValue: (row) => getPodMemReq(row),
      },
      {
        key: 'age',
        header: 'AGE',
        accessor: (row) => <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />,
        sortValue: (row) => row?.metadata?.creationTimestamp ?? '',
      },
      { key: 'spec.nodeName', header: 'NODE' },
      {
        key: 'diagnose',
        header: 'AI Dx',
        accessor: (row: Pod) => (
          <Tooltip title="AI Diagnosis" placement="bottom">
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
              <SmartToyIcon
                sx={{
                  color: isConfigured ? '#b42323ff' : 'text.primary',
                  filter: isConfigured ? 'drop-shadow(0 0 0.8px text.primary) drop-shadow(0 0 1px text.primary)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    actions: [
      { id: 'describe', label: 'Describe', icon: InfoIcon },
      { id: 'edit', label: 'Edit', icon: EditIcon },
      { id: 'logs', label: 'Logs', icon: ArticleIcon },
      { id: 'exec', label: 'Exec', icon: TerminalIcon },
      { id: 'port-forward', label: 'Port Forward', icon: SettingsEthernetIcon },
      { id: 'delete', label: 'Delete', icon: DeleteIcon },
    ],
  };

  const handleDiagnose = (pod: Pod) => {
    selectPodForAction(pod, 'diagnosis');
  };

  const handleAction = (actionId: string, pod: Pod) => {
    if (actionId === 'edit') {
      selectPodForAction(pod, 'edit');
    } else if (actionId === 'delete') {
      selectPodForAction(pod, 'delete');
    } else if (actionId === 'logs') {
      selectPodForAction(pod, 'logs');
    } else if (actionId === 'exec') {
      selectPodForAction(pod, 'exec');
    } else if (actionId === 'port-forward') {
      selectPodForAction(pod, 'port-forward');
    } else if (actionId === 'describe') {
      selectPodForAction(pod, 'describe');
    }
  };

  const handleClose = () => {
    setActionType(null);
    setSelectedPod(null);
  };

  const confirmDelete = () => {
    if (selectedPod) {
      deleteResouce({
        apiVersion: 'v1',
        kind: 'Pod',
        namespace: selectedPod.namespace,
        name: selectedPod.podName,
      });
    }

    handleClose();
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
    <PageLayout title="Pods" description="Real-time monitoring dashboard for pods">
      <ResourceTable config={podConfig} data={pods} onAction={handleAction} />
      {selectedPod && actionType === 'exec' && (
        <PodExecDrawer
          open={true}
          onClose={handleClose}
          namespace={selectedPod.namespace}
          podName={selectedPod.podName}
          containers={selectedPod.containers!}
          defaultContainer={selectedPod.defaultContainer}
          socket={socket}
        />
      )}
      {selectedPod && actionType === 'logs' && (
        <PodLogsDrawer
          open={true}
          onClose={handleClose}
          namespace={selectedPod.namespace}
          podName={selectedPod.podName}
          containers={selectedPod.containers!}
          defaultContainer={selectedPod.defaultContainer}
          socket={socket}
        />
      )}

      {selectedPod && actionType === 'port-forward' && (
        <PodPortForwardDrawer open={true} onClose={handleClose} namespace={selectedPod.namespace} podName={selectedPod.podName} socket={socket} detectedPorts={selectedPod.ports} />
      )}

      {selectedPod && actionType === 'edit' && <ResourceEditor open={true} onClose={handleClose} apiVersion="v1" kind="Pod" namespace={selectedPod.namespace} name={selectedPod.podName} />}

      {selectedPod && actionType === 'diagnosis' && <PodDiagnosisDialog open={true} onClose={handleClose} namespace={selectedPod.namespace} podName={selectedPod.podName} />}

      {selectedPod && actionType === 'delete' && (
        <ResourceDeleteConfirmDialog open={true} onClose={handleClose} onConfirm={confirmDelete} resourceName={selectedPod?.podName || ''} resourceKind="Pod" isDeleting={isDeleting} />
      )}

      <ResourceDescribeDrawer open={actionType === 'describe'} onClose={handleClose} apiVersion="v1" kind="Pod" namespace={selectedPod?.namespace ?? ''} name={selectedPod?.podName ?? ''} />
    </PageLayout>
  );
}

export default Pods;
