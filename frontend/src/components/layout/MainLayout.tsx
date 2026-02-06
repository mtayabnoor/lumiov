import {
  Box,
  CssBaseline,
  Toolbar,
  AppBar,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import Sidebar from "./Sidebar";
import { useThemeMode } from "../../context/ThemeContext";

const LOGO_SRC = "lumiov.ico";
const HEADER_HEIGHT = "50px";

function MainLayout() {
  const { mode, toggleTheme } = useThemeMode();

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
    </Box>
  );
}

export default MainLayout;
