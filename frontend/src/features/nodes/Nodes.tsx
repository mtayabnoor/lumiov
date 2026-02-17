import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { Node } from "../../interfaces/node";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

const getNodeStatus = (node: Node) => {
  const readyCondition = node.status?.conditions?.find(
    (c) => c.type === "Ready",
  );
  if (!readyCondition)
    return { kind: "status", label: "Unknown", cssClass: "info" };
  return readyCondition.status === "True"
    ? { kind: "status", label: "Ready", cssClass: "success" }
    : { kind: "status", label: "NotReady", cssClass: "error" };
};

const getNodeRoles = (node: Node) => {
  const labels = node.metadata?.labels ?? {};
  const roles = Object.keys(labels)
    .filter((k) => k.startsWith("node-role.kubernetes.io/"))
    .map((k) => k.replace("node-role.kubernetes.io/", ""));
  return roles.length > 0 ? roles.join(", ") : "<none>";
};

function Nodes() {
  const { data: nodes, error, loading } = useResource<Node>("nodes");

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<{
    name: string;
  } | null>(null);

  const nodeConfig: ResourceTableConfig = {
    columns: [
      { key: "metadata.name", header: "NAME" },
      {
        key: "status",
        header: "STATUS",
        accessor: (row: Node) => getNodeStatus(row),
      },
      {
        key: "roles",
        header: "ROLES",
        accessor: (row: Node) => getNodeRoles(row),
      },
      {
        key: "version",
        header: "VERSION",
        accessor: (row: Node) => row.status?.nodeInfo?.kubeletVersion ?? "-",
      },
      {
        key: "os",
        header: "OS IMAGE",
        accessor: (row: Node) => row.status?.nodeInfo?.osImage ?? "-",
      },
      {
        key: "arch",
        header: "ARCH",
        accessor: (row: Node) => row.status?.nodeInfo?.architecture ?? "-",
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: Node) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, node: Node) => {
    if (actionId === "edit") {
      setEditingNode({ name: node.metadata.name });
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
    <PageLayout title="Nodes" description="Cluster nodes and their status">
      <ResourceTable config={nodeConfig} data={nodes} onAction={handleAction} />
      {editingNode && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingNode(null);
          }}
          apiVersion="v1"
          kind="Node"
          namespace=""
          name={editingNode.name}
        />
      )}
    </PageLayout>
  );
}

export default Nodes;
