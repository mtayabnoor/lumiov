import { Box, CssBaseline, Toolbar, AppBar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

// OPTION A: Import from assets (Best if file is in src/assets/logo.png)
// import logoImg from "../assets/logo.png";

// OPTION B: Reference public folder directly
const LOGO_SRC = "lumiov.ico"; // Or "/icon.png"

const HEADER_HEIGHT = "50px";

function MainLayout() {
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <CssBaseline />

      {/* Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          height: HEADER_HEIGHT,
          /*backgroundColor: "#1e1e1e",
          borderBottom: "1px solid #333",*/
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
          {/* TITLE + CUSTOM LOGO */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* 👇 YOUR CUSTOM ICON HERE 👇 */}
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Lumiov Logo"
              sx={{
                height: 24, // Adjust size (20px - 30px is good for this bar)
                width: 24, // Keep aspect ratio
                marginRight: 1.5, // Space between logo and text
                objectFit: "contain", // Ensures image doesn't stretch
              }}
            />

            <Typography
              variant="subtitle2"
              noWrap
              component="div"
              sx={{
                /*fontFamily: '"Consolas", "Monaco", "Courier New", monospace',*/
                fontSize: "18px",
                fontWeight: 600,
                color: "#ffffffff",
                letterSpacing: "0.5px",
              }}
            >
              Lumiov
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
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
