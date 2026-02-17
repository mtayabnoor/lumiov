import { Box, Grid } from "@mui/material";
import PodStatusChart from "../../components/charts/PodStatusChart";
import DeploymentHealthChart from "../../components/charts/DeploymentHealthChart";
import PodRestartChart from "../../components/charts/PodRestartChart";
import NamespaceDistributionChart from "../../components/charts/NamespaceDistributionChart";
import ContainerReadinessChart from "../../components/charts/ContainerReadinessChart";
import SummaryCard from "../../components/charts/SummaryCard";
import PageLayout from "../../components/common/PageLayout/PageLayout";
import { useResource } from "../../hooks/useResource";
import type { Deployment } from "../../interfaces/deployment";
import type { Pod } from "../../interfaces/pod";

function Overview() {
  const { data: pods, loading: podsLoading } = useResource<Pod>("pods");
  const { data: deployments, loading: depsLoading } =
    useResource<Deployment>("deployments");

  // Calculate summary metrics
  const runningPods = pods.filter((p) => p.status?.phase === "Running").length;
  const pendingPods = pods.filter((p) => p.status?.phase === "Pending").length;
  const failedPods = pods.filter((p) => p.status?.phase === "Failed").length;

  const healthyDeployments = deployments.filter(
    (d) => d.status?.readyReplicas === d.spec?.replicas,
  ).length;

  const totalContainers = pods.reduce(
    (sum, p) => sum + (p.status?.containerStatuses?.length || 0),
    0,
  );

  const podsWithRestarts = pods.filter((p) =>
    p.status?.containerStatuses?.some((cs) => cs.restartCount > 0),
  ).length;

  return (
    <PageLayout title="Overview" description="Real-time monitoring dashboard">
      {/* Summary Cards Row */}
      <Box
        sx={{
          flexGrow: 0,
          flexShrink: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Total Pods"
              value={pods.length}
              loading={podsLoading}
              color="#3b82f6"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Running"
              value={runningPods}
              loading={podsLoading}
              color="#22c55e"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Pending"
              value={pendingPods}
              loading={podsLoading}
              color="#f59e0b"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Failed"
              value={failedPods}
              loading={podsLoading}
              color="#ef4444"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Deployments"
              value={deployments.length}
              loading={depsLoading}
              color="#8b5cf6"
              subtitle={`${healthyDeployments} healthy`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Containers"
              value={totalContainers}
              loading={podsLoading}
              color="#06b6d4"
            />
          </Grid>
        </Grid>

        {/* Charts Grid */}
        <Grid container spacing={3}>
          {/* Pod Status Distribution */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <PodStatusChart pods={pods} />
          </Grid>

          {/* Container Readiness */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ContainerReadinessChart pods={pods} />
          </Grid>

          {/* Namespace Distribution */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <NamespaceDistributionChart
              pods={pods}
              deployments={deployments}
              title="Resources by Namespace"
            />
          </Grid>

          {/* Deployment Health */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <DeploymentHealthChart deployments={deployments} />
          </Grid>

          {/* Pod Restarts */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <PodRestartChart pods={pods} />
          </Grid>
        </Grid>
      </Box>
    </PageLayout>
  );
}

export default Overview;
