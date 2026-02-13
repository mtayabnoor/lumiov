import { useResource } from "../../hooks/useResource";
import { ResourceTableConfig } from "../../interfaces/common";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ResourceTable from "../../components/common/Table/ResourceTable";
import { Service } from "../../interfaces/service";
import { Box, CircularProgress, Alert } from "@mui/material";
import ResourceLiveAge from "../../components/common/ResourceLiveAge/ResourceLiveAge";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import ResourceEditor from "../../components/common/Editor/ResourceEditor";
import { useState } from "react";

function Services() {
  const { data: services, error, loading } = useResource<Service>("services");

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
        key: "type",
        header: "TYPE",
        accessor: (row: Service) => row.spec?.type ?? "ClusterIP",
      },
      {
        key: "clusterIP",
        header: "CLUSTER-IP",
        accessor: (row: Service) => row.spec?.clusterIP ?? "-",
      },
      {
        key: "externalIP",
        header: "EXTERNAL-IP",
        accessor: (row: Service) => {
          const ingress = row.status?.loadBalancer?.ingress;
          if (ingress?.length)
            return ingress.map((i) => i.ip || i.hostname).join(", ");
          if (row.spec?.externalIPs?.length)
            return row.spec.externalIPs.join(", ");
          return "<none>";
        },
      },
      {
        key: "ports",
        header: "PORT(S)",
        accessor: (row: Service) => {
          if (!row.spec?.ports?.length) return "-";
          return row.spec.ports
            .map((p) => {
              let s = `${p.port}/${p.protocol ?? "TCP"}`;
              if (p.nodePort) s += `:${p.nodePort}`;
              return s;
            })
            .join(", ");
        },
      },
      {
        key: "age",
        header: "AGE",
        accessor: (row: Service) => (
          <ResourceLiveAge creationTimestamp={row.metadata.creationTimestamp} />
        ),
      },
    ],
    actions: [
      { id: "edit", label: "Edit", icon: EditIcon },
      { id: "delete", label: "Delete", icon: DeleteIcon },
    ],
  };

  const handleAction = (actionId: string, row: Service) => {
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
      title="Services"
      description="Real-time monitoring dashboard for services"
    >
      <ResourceTable config={config} data={services} onAction={handleAction} />
      {editingResource && (
        <ResourceEditor
          open={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingResource(null);
          }}
          apiVersion="v1"
          kind="Service"
          namespace={editingResource.namespace}
          name={editingResource.name}
        />
      )}
    </PageLayout>
  );
}

export default Services;
