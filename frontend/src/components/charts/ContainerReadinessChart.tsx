import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Paper, Chip, alpha } from '@mui/material';
import type { Pod } from '../../interfaces/pod';

interface ContainerReadinessChartProps {
  pods: Pod[];
  title?: string;
}

function ContainerReadinessChart({ pods, title = 'Container Readiness' }: ContainerReadinessChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const colors = {
    ready: isDark ? '#4ade80' : '#22c55e',
    notReady: isDark ? '#f87171' : '#ef4444',
    bg: isDark ? '#374151' : '#e5e7eb',
  };

  let ready = 0;
  let notReady = 0;
  pods.forEach((pod) => {
    pod.status?.containerStatuses?.forEach((cs) => {
      if (cs.ready) ready++;
      else notReady++;
    });
  });

  const totalContainers = ready + notReady;
  const readyPercent = totalContainers > 0 ? Math.round((ready / totalContainers) * 100) : 0;

  const centerColor = readyPercent >= 95 ? colors.ready : readyPercent >= 80 ? (isDark ? '#fbbf24' : '#f59e0b') : colors.notReady;

  // Single arc: ready portion + bg remainder
  const chartData =
    totalContainers === 0
      ? [{ name: 'No data', value: 1, color: colors.bg }]
      : [{ name: 'Ready', value: ready, color: colors.ready }, ...(notReady > 0 ? [{ name: 'Not Ready', value: notReady, color: colors.notReady }] : [])];

  if (totalContainers === 0) {
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
        <Typography color="text.secondary">No containers available</Typography>
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
      {/* Title */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {totalContainers} container{totalContainers !== 1 ? 's' : ''} tracked
        </Typography>
      </Box>

      {/* Ring */}
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.ready} stopOpacity={0.8} />
                <stop offset="100%" stopColor={colors.ready} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="notReadyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.notReady} stopOpacity={0.8} />
                <stop offset="100%" stopColor={colors.notReady} stopOpacity={1} />
              </linearGradient>
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={900}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.name === 'Ready' ? 'url(#readyGrad)' : entry.name === 'Not Ready' ? 'url(#notReadyGrad)' : entry.color}
                  stroke={theme.palette.background.paper}
                  strokeWidth={2}
                />
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
                const pct = totalContainers > 0 ? ((v / totalContainers) * 100).toFixed(1) : '0';
                return [`${v} container${v !== 1 ? 's' : ''} (${pct}%)`, String(name)];
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
            {readyPercent}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
            Ready
          </Typography>
        </Box>
      </Box>

      {/* Chip summary row */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'center' }}>
        <Chip
          label={`${ready} ready`}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(colors.ready, 0.12),
            color: colors.ready,
            border: `1px solid ${alpha(colors.ready, 0.25)}`,
            '& .MuiChip-label': { px: 1 },
          }}
        />
        {notReady > 0 && (
          <Chip
            label={`${notReady} not ready`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: alpha(colors.notReady, 0.12),
              color: colors.notReady,
              border: `1px solid ${alpha(colors.notReady, 0.25)}`,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

export default ContainerReadinessChart;
