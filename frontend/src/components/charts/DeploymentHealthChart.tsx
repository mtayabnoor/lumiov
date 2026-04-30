import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Paper } from '@mui/material';
import type { Deployment } from '../../interfaces/deployment';

interface DeploymentHealthChartProps {
  deployments: Deployment[];
  title?: string;
}

function DeploymentHealthChart({ deployments, title = 'Deployment Replica Status' }: DeploymentHealthChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colors = {
    ready: isDark ? '#4ade80' : '#22c55e',
    unavailable: isDark ? '#f87171' : '#ef4444',
    updating: isDark ? '#fbbf24' : '#f59e0b',
  };

  const chartData = deployments
    .slice(0, 8)
    .map((deployment) => {
      const desired = deployment.spec?.replicas ?? 0;
      const ready = deployment.status?.readyReplicas ?? 0;
      const unavailable = deployment.status?.unavailableReplicas ?? 0;
      const updating = Math.max(0, desired - ready - unavailable);
      const healthPct = desired > 0 ? Math.round((ready / desired) * 100) : 100;
      const name = deployment.metadata.name.length > 14 ? `${deployment.metadata.name.slice(0, 14)}…` : deployment.metadata.name;

      return {
        name,
        fullName: deployment.metadata.name,
        ready,
        unavailable,
        updating,
        desired,
        healthPct,
        namespace: deployment.metadata.namespace,
      };
    })
    // Sort worst health first — most actionable
    .sort((a, b) => a.healthPct - b.healthPct);

  const healthyCount = deployments.filter((d) => (d.status?.readyReplicas ?? 0) === (d.spec?.replicas ?? 0) && (d.spec?.replicas ?? 0) > 0).length;

  if (deployments.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography color="text.secondary">No deployments available</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {healthyCount} of {deployments.length} fully ready · sorted by health
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
            <defs>
              <linearGradient id="dhReadyGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={isDark ? '#4ade80' : '#22c55e'} stopOpacity={0.85} />
                <stop offset="100%" stopColor={isDark ? '#86efac' : '#4ade80'} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="dhUnavailGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={isDark ? '#f87171' : '#ef4444'} stopOpacity={0.85} />
                <stop offset="100%" stopColor={isDark ? '#fca5a5' : '#f87171'} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="dhUpdatingGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={isDark ? '#fbbf24' : '#f59e0b'} stopOpacity={0.85} />
                <stop offset="100%" stopColor={isDark ? '#fde68a' : '#fcd34d'} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke={isDark ? '#2e2e2e' : '#f0f0f0'} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} width={110} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                color: theme.palette.text.primary,
                fontSize: 13,
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload;
                if (!p) return '';
                return `${p.fullName} · ${p.healthPct}% healthy`;
              }}
              formatter={(value, name) => [value ?? 0, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
              formatter={(value) => <span style={{ color: theme.palette.text.secondary, fontSize: 12 }}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span>}
            />
            <Bar dataKey="ready" stackId="a" fill="url(#dhReadyGrad)" name="ready" />
            <Bar dataKey="updating" stackId="a" fill="url(#dhUpdatingGrad)" name="updating" />
            <Bar dataKey="unavailable" stackId="a" fill="url(#dhUnavailGrad)" radius={[0, 3, 3, 0]} name="unavailable" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default DeploymentHealthChart;
