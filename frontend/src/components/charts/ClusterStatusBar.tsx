import { useEffect, useState } from 'react';
import { Box, Paper, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { Pod } from '../../interfaces/pod';
import type { Deployment } from '../../interfaces/deployment';

interface ClusterStatusBarProps {
  pods: Pod[];
  deployments: Deployment[];
}

type HealthStatus = 'healthy' | 'degraded' | 'critical';

function getHealthStatus(runningPods: number, totalPods: number): HealthStatus {
  if (totalPods === 0) return 'healthy';
  const ratio = runningPods / totalPods;
  if (ratio >= 0.95) return 'healthy';
  if (ratio >= 0.8) return 'degraded';
  return 'critical';
}

function useElapsedSeconds(): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return seconds;
}

function ClusterStatusBar({ pods, deployments }: ClusterStatusBarProps) {
  const theme = useTheme();
  const elapsed = useElapsedSeconds();

  const runningPods = pods.filter((p) => p.status?.phase === 'Running').length;
  const healthyDeps = deployments.filter((d) => d.status?.readyReplicas === d.spec?.replicas && (d.spec?.replicas ?? 0) > 0).length;
  const healthStatus = getHealthStatus(runningPods, pods.length);

  const statusConfig: Record<HealthStatus, { label: string; color: string }> = {
    healthy: { label: 'Cluster Healthy', color: theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a' },
    degraded: { label: 'Cluster Degraded', color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706' },
    critical: { label: 'Cluster Critical', color: theme.palette.mode === 'dark' ? '#f87171' : '#dc2626' },
  };

  const { label, color } = statusConfig[healthStatus];

  const elapsedLabel = elapsed < 60 ? `${elapsed}s ago` : elapsed < 3600 ? `${Math.floor(elapsed / 60)}m ago` : `${Math.floor(elapsed / 3600)}h ago`;

  return (
    <Paper
      elevation={0}
      sx={{
        px: 3,
        py: 1.5,
        mb: 3,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: alpha(color, 0.3),
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: color,
        },
      }}
    >
      {/* Status indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <FiberManualRecordIcon
            sx={{
              fontSize: 10,
              color,
              '@keyframes pulse': {
                '0%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.5, transform: 'scale(1.4)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color }}>
          {label}
        </Typography>
      </Box>

      {/* Center stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Pods stat */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            minWidth: 80,
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {runningPods}/{pods.length}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pods running</Typography>
        </Box>

        <Box sx={{ width: '1px', height: 28, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />

        {/* Deployments stat */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            minWidth: 80,
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
            {healthyDeps}/{deployments.length}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Deploys ready</Typography>
        </Box>
      </Box>

      {/* Live badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Updated {elapsedLabel}
        </Typography>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a', 0.12),
            border: '1px solid',
            borderColor: alpha(theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a', 0.3),
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <FiberManualRecordIcon
            sx={{
              fontSize: 6,
              color: theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
              '@keyframes livePulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
              animation: 'livePulse 1.5s ease-in-out infinite',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
              fontWeight: 600,
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
            }}
          >
            LIVE
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default ClusterStatusBar;
