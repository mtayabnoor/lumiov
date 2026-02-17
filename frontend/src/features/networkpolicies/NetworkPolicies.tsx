import { useResource } from "../../hooks/useResource";
import type { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import type { NetworkPolicy } from "../../interfaces/network-policy";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function NetworkPolicies() {
  const {
    data: policies,
    error,
    loading,
  } = useResource<NetworkPolicy>("networkpolicies");

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
        key: "policyTypes",
        header: "POLICY TYPES",
        accessor: (row: NetworkPolicy) =>
          row.spec?.policyTypes?.join(", ") ?? "-",
      },
      {
        key: "podSelector",
        header: "POD SELECTOR",
        accessor: (row: NetworkPolicy) => {
          const labels = row.spec?.podSelector?.matchLabels;
          if (!labels || Object.keys(labels).length === 0) return "<all pods>";
          return Object.entries(labels)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ");
        },
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: NetworkPolicy) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: NetworkPolicy) => {
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
      title="Network Policies"
      description="Real-time monitoring dashboard for network policies"
    >
      <ResourceTable config={config} data={policies} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="networking.k8s.io/v1"
          kind="NetworkPolicy"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default NetworkPolicies;
