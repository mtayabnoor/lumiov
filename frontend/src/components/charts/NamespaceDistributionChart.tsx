import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Paper } from '@mui/material';
import type { Pod } from '../../interfaces/pod';
import type { Deployment } from '../../interfaces/deployment';

interface NamespaceDistributionChartProps {
  pods?: Pod[];
  deployments?: Deployment[];
  title?: string;
  resourceType?: 'pods' | 'deployments' | 'both';
}

function NamespaceDistributionChart({ pods = [], deployments = [], title = 'Resources by Namespace', resourceType = 'both' }: NamespaceDistributionChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const namespaceMap: Record<string, { pods: number; deployments: number }> = {};

  if (resourceType === 'pods' || resourceType === 'both') {
    pods.forEach((pod) => {
      const ns = pod.metadata.namespace || 'default';
      if (!namespaceMap[ns]) namespaceMap[ns] = { pods: 0, deployments: 0 };
      namespaceMap[ns].pods++;
    });
  }

  if (resourceType === 'deployments' || resourceType === 'both') {
    deployments.forEach((dep) => {
      const ns = dep.metadata.namespace || 'default';
      if (!namespaceMap[ns]) namespaceMap[ns] = { pods: 0, deployments: 0 };
      namespaceMap[ns].deployments++;
    });
  }

  const chartData = Object.entries(namespaceMap)
    .map(([name, counts]) => ({
      name: name.length > 10 ? `${name.slice(0, 10)}…` : name,
      fullName: name,
      pods: counts.pods,
      deployments: counts.deployments,
      total: counts.pods + counts.deployments,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const totalNamespaces = Object.keys(namespaceMap).length;

  if (chartData.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          height: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography color="text.secondary">No resources available</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: 360,
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
          {totalNamespaces} namespace{totalNamespaces !== 1 ? 's' : ''} · top {chartData.length} shown
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 30 }} barCategoryGap="35%">
            <defs>
              <linearGradient id="nsPodsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#93c5fd' : '#60a5fa'} stopOpacity={1} />
                <stop offset="100%" stopColor={isDark ? '#3b82f6' : '#1d4ed8'} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="nsDepsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#c4b5fd' : '#a78bfa'} stopOpacity={1} />
                <stop offset="100%" stopColor={isDark ? '#7c3aed' : '#5b21b6'} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2e2e2e' : '#f0f0f0'} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} angle={-35} textAnchor="end" height={50} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} width={28} />
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
                const full = payload?.[0]?.payload?.fullName || '';
                const total = payload?.[0]?.payload?.total || 0;
                return `${full} · ${total} total`;
              }}
              formatter={(value, name) => [value ?? 0, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            />
            {(resourceType === 'pods' || resourceType === 'both') && <Bar dataKey="pods" fill="url(#nsPodsGrad)" radius={[3, 3, 0, 0]} name="Pods" maxBarSize={32} />}
            {(resourceType === 'deployments' || resourceType === 'both') && <Bar dataKey="deployments" fill="url(#nsDepsGrad)" radius={[3, 3, 0, 0]} name="Deployments" maxBarSize={32} />}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default NamespaceDistributionChart;
