// Shared drawer styling constants
// These should match the application's dark theme from theme/dark.ts

export const DRAWER_STYLES = {
  // Colors matching theme
  paper: {
    bgcolor: '#2d2f31', // Slightly darker than app background for contrast
    headerBg: '#3a3c3e', // Header background
    bodyBg: '#1e1e1e', // Terminal/console body background
  },

  // Border colors
  border: {
    color: 'rgba(255, 255, 255, 0.08)', // Subtle border
    header: 'rgba(255, 255, 255, 0.06)',
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af', // grey.400 equivalent
    muted: '#6b7280', // grey.500 equivalent
  },

  // Interactive element colors
  controls: {
    icon: '#9ca3af',
    iconHover: '#d1d5db',
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputBorderHover: 'rgba(255, 255, 255, 0.2)',
  },

  // Status colors
  status: {
    connected: {
      bg: 'rgba(52, 211, 153, 0.15)', // Emerald tint
      text: '#34d399', // Emerald-400
    },
    error: {
      bg: 'rgba(248, 113, 113, 0.15)', // Red tint
      text: '#f87171', // Red-400
    },
    warning: {
      bg: 'rgba(251, 191, 36, 0.15)', // Amber tint
      text: '#fbbf24', // Amber-400
    },
  },

  // Menu styling
  menu: {
    bg: '#3a3c3e',
    itemHover: 'rgba(255, 255, 255, 0.08)',
    itemSelected: 'rgba(96, 165, 250, 0.15)', // Primary blue tint
  },
} as const;

// Common drawer paper props
export const getDrawerPaperSx = (height: string) => ({
  height,
  bgcolor: DRAWER_STYLES.paper.bgcolor,
  color: DRAWER_STYLES.text.primary,
  display: 'flex',
  flexDirection: 'column' as const,
  transition: 'height 0.3s ease-in-out',
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  borderTop: `1px solid ${DRAWER_STYLES.border.color}`,
});

// Common header styles
export const DRAWER_HEADER_SX = {
  p: 1.5,
  bgcolor: DRAWER_STYLES.paper.headerBg,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${DRAWER_STYLES.border.header}`,
  flexShrink: 0,
};

// Common select styles
export const getSelectSx = (primaryColor: string) => ({
  height: 32,
  color: DRAWER_STYLES.text.primary,
  fontSize: '0.875rem',
  bgcolor: DRAWER_STYLES.controls.inputBg,
  '.MuiOutlinedInput-notchedOutline': {
    borderColor: DRAWER_STYLES.controls.inputBorder,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: DRAWER_STYLES.controls.inputBorderHover,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: primaryColor,
  },
  '.MuiSvgIcon-root': {
    color: DRAWER_STYLES.controls.icon,
  },
});

// Common menu props
export const getMenuProps = () => ({
  PaperProps: {
    sx: {
      bgcolor: DRAWER_STYLES.menu.bg,
      color: DRAWER_STYLES.text.primary,
      border: `1px solid ${DRAWER_STYLES.controls.inputBorder}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      '& .MuiMenuItem-root': {
        fontSize: '0.875rem',
        '&:hover': { bgcolor: DRAWER_STYLES.menu.itemHover },
        '&.Mui-selected': { bgcolor: DRAWER_STYLES.menu.itemSelected },
      },
    },
  },
});

// Common icon button styles
export const ICON_BUTTON_SX = {
  color: DRAWER_STYLES.controls.icon,
  '&:hover': {
    color: DRAWER_STYLES.controls.iconHover,
    bgcolor: 'rgba(255, 255, 255, 0.05)',
  },
};

// Connected chip styles
export const CONNECTED_CHIP_SX = {
  bgcolor: DRAWER_STYLES.status.connected.bg,
  color: DRAWER_STYLES.status.connected.text,
  fontSize: '0.75rem',
  height: 24,
  fontWeight: 500,
  '& .MuiChip-icon': {
    color: DRAWER_STYLES.status.connected.text,
  },
};

// Pulsing dot animation for connected status
export const PULSE_DOT_SX = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  bgcolor: DRAWER_STYLES.status.connected.text,
  ml: 1,
  animation: 'pulse 2s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.4 },
  },
};

// Divider styles
export const DIVIDER_SX = {
  bgcolor: DRAWER_STYLES.controls.inputBorder,
  mx: 1,
  height: 24,
  alignSelf: 'center',
};
