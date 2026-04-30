import { Paper, Typography, CircularProgress, Box, LinearProgress, alpha } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface SummaryCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
  color?: string;
  subtitle?: string;
  icon?: SvgIconComponent;
  healthPercent?: number;
}

function SummaryCard({ title, value, loading, color, subtitle, icon: Icon, healthPercent }: SummaryCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: color ? alpha(color, 0.07) : 'background.paper',
        border: '1px solid',
        borderColor: color ? alpha(color, 0.18) : 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: color ? `0 4px 20px ${alpha(color, 0.2)}` : '0 4px 20px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Header row: title + icon */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: '0.08em',
            fontSize: '0.68rem',
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
        {Icon && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              bgcolor: color ? alpha(color, 0.15) : 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              ml: 1,
            }}
          >
            <Icon sx={{ fontSize: 18, color: color || 'text.secondary' }} />
          </Box>
        )}
      </Box>

      {/* Value */}
      {loading ? (
        <CircularProgress size={22} sx={{ color: color || 'primary.main' }} />
      ) : (
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: color || 'text.primary',
              lineHeight: 1.15,
              fontSize: '1.75rem',
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Optional health progress bar at the bottom */}
      {healthPercent !== undefined && !loading && (
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, healthPercent))}
            sx={{
              height: 3,
              borderRadius: 2,
              bgcolor: alpha(color || '#999', 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: color || 'primary.main',
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

export default SummaryCard;
