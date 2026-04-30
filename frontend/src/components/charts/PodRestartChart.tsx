import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Paper, alpha } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { Pod } from '../../interfaces/pod';

interface PodRestartChartProps {
  pods: Pod[];
  title?: string;
  maxPods?: number;
}

function PodRestartChart({ pods, title = 'Restart Alerts', maxPods = 10 }: PodRestartChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartData = pods
    .map((pod) => {
      const totalRestarts = pod.status?.containerStatuses?.reduce((sum, cs) => sum + (cs.restartCount || 0), 0) || 0;
      return {
        name: pod.metadata.name.length > 18 ? `${pod.metadata.name.slice(0, 18)}…` : pod.metadata.name,
        fullName: pod.metadata.name,
        restarts: totalRestarts,
        namespace: pod.metadata.namespace,
      };
    })
    .filter((p) => p.restarts > 0)
    .sort((a, b) => b.restarts - a.restarts)
    .slice(0, maxPods);

  const hasCritical = chartData.some((p) => p.restarts >= 10);

  const getBarColor = (restarts: number) => {
    if (restarts >= 10) return isDark ? '#f87171' : '#ef4444';
    if (restarts >= 5) return isDark ? '#fbbf24' : '#f59e0b';
    return isDark ? '#60a5fa' : '#3b82f6';
  };

  if (chartData.length === 0) {
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
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            p: 2.5,
            borderRadius: 2,
            bgcolor: alpha(isDark ? '#4ade80' : '#22c55e', 0.08),
            border: `1px solid ${alpha(isDark ? '#4ade80' : '#22c55e', 0.2)}`,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 32, color: isDark ? '#4ade80' : '#16a34a' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#4ade80' : '#16a34a' }}>
            All pods stable
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            No restart events detected
          </Typography>
        </Box>
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
      {/* Title with warning badge */}
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {hasCritical && <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#f87171' : '#dc2626' }} />}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {chartData.length} pod{chartData.length !== 1 ? 's' : ''} with restarts · sorted by severity
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke={isDark ? '#2e2e2e' : '#f0f0f0'} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} width={130} />
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
                return p ? `${p.fullName} (${p.namespace})` : '';
              }}
              formatter={(value) => {
                const v = Number(value) || 0;
                const severity = v >= 10 ? 'Critical' : v >= 5 ? 'Warning' : 'Info';
                return [`${v} restart${v !== 1 ? 's' : ''} · ${severity}`, 'Restarts'];
              }}
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="restarts" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.fullName}`} fill={getBarColor(entry.restarts)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default PodRestartChart;
