import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Paper, Chip, alpha } from '@mui/material';
import type { Pod } from '../../interfaces/pod';

interface PodStatusChartProps {
  pods: Pod[];
  title?: string;
}

const getPhaseColors = (isDark: boolean) => ({
  Running: isDark ? '#4ade80' : '#22c55e',
  Pending: isDark ? '#fbbf24' : '#f59e0b',
  Succeeded: isDark ? '#60a5fa' : '#3b82f6',
  Failed: isDark ? '#f87171' : '#ef4444',
  Unknown: isDark ? '#9ca3af' : '#6b7280',
});

function PodStatusChart({ pods, title = 'Pod Status Distribution' }: PodStatusChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const COLORS = getPhaseColors(isDark);

  const statusCounts: Record<string, number> = {};
  pods.forEach((pod) => {
    const phase = pod.status?.phase || 'Unknown';
    statusCounts[phase] = (statusCounts[phase] || 0) + 1;
  });

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS] || COLORS.Unknown,
  }));

  const runningCount = statusCounts['Running'] || 0;
  const runningPercent = pods.length > 0 ? Math.round((runningCount / pods.length) * 100) : 0;
  const centerColor = runningPercent >= 95 ? (isDark ? '#4ade80' : '#22c55e') : runningPercent >= 80 ? (isDark ? '#fbbf24' : '#f59e0b') : isDark ? '#f87171' : '#ef4444';

  if (pods.length === 0) {
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
        <Typography color="text.secondary">No pods available</Typography>
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
      {/* Title + subtitle */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {pods.length} pod{pods.length !== 1 ? 's' : ''} across all namespaces
        </Typography>
      </Box>

      {/* Donut chart */}
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {chartData.map((entry) => (
                <linearGradient key={`grad-${entry.name}`} id={`podGrad-${entry.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" animationBegin={0} animationDuration={800}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={`url(#podGrad-${entry.name})`} stroke={theme.palette.background.paper} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                color: theme.palette.text.primary,
                fontSize: 13,
              }}
              formatter={(value, name) => {
                const v = Number(value) || 0;
                const pct = pods.length > 0 ? ((v / pods.length) * 100).toFixed(1) : '0';
                return [`${v} pod${v !== 1 ? 's' : ''} (${pct}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.6rem',
              lineHeight: 1.1,
              color: centerColor,
            }}
          >
            {runningPercent}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
            Healthy
          </Typography>
        </Box>
      </Box>

      {/* Chip legend at the bottom */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5, justifyContent: 'center' }}>
        {chartData.map((entry) => (
          <Chip
            key={entry.name}
            label={`${entry.name} ${entry.value}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(entry.color, 0.12),
              color: entry.color,
              border: `1px solid ${alpha(entry.color, 0.25)}`,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}

export default PodStatusChart;
