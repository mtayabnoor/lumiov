import { Box, Grid, Typography } from '@mui/material';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import PodStatusChart from '../../components/charts/PodStatusChart';
import DeploymentHealthChart from '../../components/charts/DeploymentHealthChart';
import PodRestartChart from '../../components/charts/PodRestartChart';
import NamespaceDistributionChart from '../../components/charts/NamespaceDistributionChart';
import ContainerReadinessChart from '../../components/charts/ContainerReadinessChart';
import SummaryCard from '../../components/charts/SummaryCard';
import ClusterStatusBar from '../../components/charts/ClusterStatusBar';
import PageLayout from '../../components/common/PageLayout/PageLayout';
import { useResource } from '../../hooks/useResource';
import type { Deployment } from '../../interfaces/deployment';
import type { Pod } from '../../interfaces/pod';

function Overview() {
  const { data: pods, loading: podsLoading } = useResource<Pod>('pods');
  const { data: deployments, loading: depsLoading } = useResource<Deployment>('deployments');

  const runningPods = pods.filter((p) => p.status?.phase === 'Running').length;
  const pendingPods = pods.filter((p) => p.status?.phase === 'Pending').length;
  const failedPods = pods.filter((p) => p.status?.phase === 'Failed').length;
  const healthyDeployments = deployments.filter((d) => d.status?.readyReplicas === d.spec?.replicas && (d.spec?.replicas ?? 0) > 0).length;
  const totalContainers = pods.reduce((sum, p) => sum + (p.status?.containerStatuses?.length || 0), 0);
  const podsWithRestarts = pods.filter((p) => p.status?.containerStatuses?.some((cs) => cs.restartCount > 0)).length;

  const runningPercent = pods.length > 0 ? Math.round((runningPods / pods.length) * 100) : 0;
  const deploymentHealthPercent = deployments.length > 0 ? Math.round((healthyDeployments / deployments.length) * 100) : 0;

  return (
    <PageLayout title="Overview" description="Real-time cluster monitoring">
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 0, pb: 2 }}>
        {/* Live cluster status banner */}
        <ClusterStatusBar pods={pods} deployments={deployments} />

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard title="Total Pods" value={pods.length} loading={podsLoading} color="#3b82f6" icon={DnsOutlinedIcon} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Running"
              value={runningPods}
              loading={podsLoading}
              color="#22c55e"
              icon={CheckCircleOutlineIcon}
              healthPercent={runningPercent}
              subtitle={`${runningPercent}% of total`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard title="Pending" value={pendingPods} loading={podsLoading} color="#f59e0b" icon={HourglassEmptyIcon} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard title="Failed" value={failedPods} loading={podsLoading} color="#ef4444" icon={ErrorOutlineIcon} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Deployments"
              value={deployments.length}
              loading={depsLoading}
              color="#8b5cf6"
              icon={RocketLaunchOutlinedIcon}
              healthPercent={deploymentHealthPercent}
              subtitle={`${healthyDeployments} healthy`}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <SummaryCard
              title="Containers"
              value={totalContainers}
              loading={podsLoading}
              color="#06b6d4"
              icon={ViewInArOutlinedIcon}
              subtitle={podsWithRestarts > 0 ? `${podsWithRestarts} restarting` : undefined}
            />
          </Grid>
        </Grid>

        {/* Section: Pod Health */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>
            Pod Health
          </Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <PodStatusChart pods={pods} />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <ContainerReadinessChart pods={pods} />
          </Grid>
          <Grid size={{ xs: 12, md: 12, lg: 4 }}>
            <NamespaceDistributionChart pods={pods} deployments={deployments} title="Resources by Namespace" />
          </Grid>
        </Grid>

        {/* Section: Deployment Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em' }}>
            Deployment Status
          </Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <DeploymentHealthChart deployments={deployments} />
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <PodRestartChart pods={pods} title="Restart Alerts" />
          </Grid>
        </Grid>
      </Box>
    </PageLayout>
  );
}

export default Overview;
