import { useState } from 'react';
import { Box, Toolbar, AppBar, Typography, IconButton, Tooltip } from '@mui/material';
import { Outlet } from 'react-router-dom';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import Sidebar from './Sidebar';
import ContextSwitcher from './ContextSwitcher';
import SettingsDialog from '../common/Settings/SettingsDialog';
import { useThemeMode } from '../../context/ThemeContext';
import { useAgent } from '../../context/AgentContext';
import AgentChatPanel from '../agent/AgentChatPanel';
import AgentConfigModal from '../agent/AgentConfigModal';
import Divider from '@mui/material/Divider';
import { useSettings } from '../../context/SettingsContext';
import AgentStatusIcon from '../agent/AgentStatusIcon';
import { APP_HEADER_HEIGHT_PX } from './layoutConstants';

const LOGO_SRC = 'lumiov.png';

function MainLayout() {
  const { mode, toggleTheme } = useThemeMode();
  const { isConfigured, toggleChat } = useAgent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { changeClusterContextEnabed } = useSettings();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: APP_HEADER_HEIGHT_PX,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: `${APP_HEADER_HEIGHT_PX} !important`,
            display: 'flex',
            alignItems: 'center',
            px: 2,
          }}
        >
          {/* Logo + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="img" src={LOGO_SRC} alt="Lumiov Logo" sx={{ height: 35, width: 35, mr: 1.5, objectFit: 'contain' }} />
            <Typography
              variant="subtitle2"
              noWrap
              component="div"
              sx={{
                fontSize: '35px',
                fontWeight: 600,

                letterSpacing: '0.5px',
              }}
            >
              Lumiov
            </Typography>
          </Box>

          {/* Context Switcher */}
          {changeClusterContextEnabed && <ContextSwitcher />}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* AI Agent Button */}
          <Tooltip title="Talk to your cluster">
            <IconButton
              onClick={toggleChat}
              size="medium"
              aria-label="Open AI cluster assistant"
              //sx={{
              //  mr: 1,
              //  color: "#fff",
              //  position: "relative",

              //  borderRadius: "8px",
              //  p: 0.75,
              //"&:hover": {
              //  bgcolor: isConfigured
              //    ? "primary.dark"
              //    : "rgba(255,255,255,0.1)",
              //},
              //}}
            >
              <AgentStatusIcon isActive={isConfigured} fontSize="medium" />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.primary' }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'divider', mx: 1, height: 24, alignSelf: 'center' }} />
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton onClick={() => setSettingsOpen(true)} size="small" sx={{ color: 'text.primary' }}>
              <SettingsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: APP_HEADER_HEIGHT_PX }} />
        <Outlet />
      </Box>

      {/* Agent Components */}
      <AgentChatPanel />
      <AgentConfigModal />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}

export default MainLayout;
