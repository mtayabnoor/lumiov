import React, { useState, useEffect } from "react";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { WatchResourcePayload } from "../../interfaces/socket";
import { usePods } from "./usePod";
import { Pod } from "../../interfaces/pod";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArticleIcon from "@mui/icons-material/Article";
import TerminalIcon from "@mui/icons-material/Terminal";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";

// --- Helper Functions (Defined outside the component) ---

const getPodReadyStatus = (event: WatchResourcePayload<Pod>) => {
  const total = event.object?.spec?.containers?.length ?? 0;
  const ready =
    event.object.status?.containerStatuses?.filter(
      (c: { ready: boolean }) => c.ready,
    ).length ?? 0;
  return `${ready}/${total}`;
};

const getPodStatus = (event: WatchResourcePayload<Pod>) => {
  const status = event.object?.status?.phase?.toLowerCase();
  const total = event.object?.spec?.containers?.length ?? 0;
  const ready =
    event.object.status?.containerStatuses?.filter(
      (c: { ready: boolean }) => c.ready,
    ).length ?? 0;

  // 1. Terminating check
  if (event.object?.metadata?.deletionTimestamp) {
    return {
      kind: "status",
      label: "Terminating",
      cssClass: "border-red2", // Ensure you have css for this or use style object
    };
  }

  // 2. Running but not fully ready
  if (ready !== total && status === "running") {
    return {
      kind: "status",
      label: "Running",
      cssClass: "border-not-ready-running",
    };
  }

  // 3. Standard statuses
  switch (status) {
    case "running":
      return { kind: "status", label: "Running", cssClass: "success" };
    case "failed":
      return { kind: "status", label: "Failed", cssClass: "error" };
    case "pending":
      return { kind: "status", label: "Pending", cssClass: "warning" };
    default:
      return { kind: "status", label: "Completed", cssClass: "info" };
  }
};

const getPodRestarts = (event: WatchResourcePayload<Pod>) => {
  const containers = event?.object?.status?.containerStatuses ?? [];
  return containers.reduce(
    (sum: number, c: any) => sum + (c.restartCount || 0),
    0,
  );
};

const getPodCpuReq = (event: WatchResourcePayload<Pod>) => {
  const containers = event.object.spec?.containers ?? [];
  const totalCpu = containers
    .map((c: any) => c.resources?.requests?.cpu || "ns")
    .join(", ");
  return totalCpu || "-";
};

const getPodMemReq = (event: WatchResourcePayload<Pod>) => {
  const containers = event.object.spec?.containers ?? [];
  const totalMem = containers
    .map((c: any) => c.resources?.requests?.memory || "ns")
    .join(", ");
  return totalMem || "-";
};

const onAction = (e: { actionId: string; row: any }) => {
  const { actionId, row } = e;

  if (actionId === "edit") console.log("Edit", row);
  if (actionId === "delete") console.log("Delete", row);
  if (actionId === "logs") console.log("Logs", row);
  if (actionId === "exec") console.log("Exec", row);
};

// --- Main Component ---

function Pods() {
  const { pods, error, loading } = usePods();

  const podConfig: ResourceTableConfig = {
    columns: [
      { key: "object.metadata.namespace", header: "NAMESPACE" },
      { key: "object.metadata.name", header: "NAME" },
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
          <ResourceLiveAge
            creationTimestamp={row.object.metadata.creationTimestamp}
          />
        ),
      },
      { key: "object.spec.nodeName", header: "NODE" },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
      { id: "logs", label: "Logs", icon: ArticleIcon },
      { id: "exec", label: "Exec", icon: TerminalIcon },
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
    <ResourceTable config={podConfig} data={pods} onAction={handleAction} />
  );
}

export default Pods;
