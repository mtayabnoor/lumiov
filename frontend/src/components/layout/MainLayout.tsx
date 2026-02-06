import {
  Box,
  CssBaseline,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import Sidebar from "./Sidebar";
import { useThemeMode } from "../../context/ThemeContext";
import { useAgent } from "../../context/AgentContext";
import AgentChatPanel from "../agent/AgentChatPanel";
import AgentConfigModal from "../agent/AgentConfigModal";
import PsychologyIcon from "@mui/icons-material/Psychology";

const LOGO_SRC = "lumiov.ico";
const HEADER_HEIGHT = "50px";

function MainLayout() {
  const { mode, toggleTheme } = useThemeMode();
  const { isConfigured, toggleChat } = useAgent();

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: HEADER_HEIGHT,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: `${HEADER_HEIGHT} !important`,
            display: "flex",
            alignItems: "center",
            px: 2,
          }}
        >
          {/* Logo + Title */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Lumiov Logo"
              sx={{ height: 24, width: 24, mr: 1.5, objectFit: "contain" }}
            />
            <Typography
              variant="subtitle2"
              noWrap
              component="div"
              sx={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.5px",
              }}
            >
              Lumiov
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* AI Agent Button */}
          <Tooltip title="Talk to your cluster">
            <IconButton
              onClick={toggleChat}
              size="small"
              sx={{
                mr: 1,
                color: "#fff",
                position: "relative",

                borderRadius: "8px",
                p: 0.75,
                //"&:hover": {
                //  bgcolor: isConfigured
                //    ? "primary.dark"
                //    : "rgba(255,255,255,0.1)",
                //},
              }}
            >
              <PsychologyIcon
                fontSize="medium"
                sx={{
                  color: isConfigured ? "#e02222ff" : "#fff",
                  filter: isConfigured
                    ? "drop-shadow(0 0 2px #ffffffff) drop-shadow(0 0 4px #ffffffff)"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip
            title={
              mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{ color: "#fff" }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ height: HEADER_HEIGHT }} />
        <Outlet />
      </Box>

      {/* Agent Components */}
      <AgentChatPanel />
      <AgentConfigModal />
    </Box>
  );
}

export default MainLayout;
