import PsychologyIcon from '@mui/icons-material/Psychology';
import type { SxProps, Theme } from '@mui/material/styles';

interface AgentStatusIconProps {
  isActive: boolean;
  fontSize?: 'inherit' | 'large' | 'medium' | 'small';
  sx?: SxProps<Theme>;
}

export default function AgentStatusIcon({ isActive, fontSize = 'medium', sx }: AgentStatusIconProps) {
  return (
    <PsychologyIcon
      fontSize={fontSize}
      sx={[
        {
          color: isActive ? 'error.main' : 'text.primary',
          filter: isActive ? 'drop-shadow(0 0 2px text.primary) drop-shadow(0 0 4px text.primary)' : 'none',
          transition: 'all 0.3s ease',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
