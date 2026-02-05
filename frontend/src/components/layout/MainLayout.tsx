import { Box, CssBaseline, Toolbar, AppBar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import CodeIcon from "@mui/icons-material/Code";

// Define height once to keep everything synced
const HEADER_HEIGHT = "50px";

function MainLayout() {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Header */}
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
            alignItems: "center", // Vertically centers items
            px: 2, // Horizontal padding (16px)
          }}
        >
          {/* TITLE ON THE LEFT */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CodeIcon sx={{ fontSize: 25, color: "#4e78d1ff", mr: 1 }} />
            <Typography
              variant="subtitle2"
              noWrap
              component="div"
              sx={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#ffffffff",
                letterSpacing: "0.5px",
              }}
            >
              Lumiov
            </Typography>
            <CodeIcon sx={{ fontSize: 25, color: "#4e78d1ff", ml: 1 }} />
            {/* Removed the second icon to make it cleaner on the left, but you can add it back if you like */}
          </Box>

          {/* Spacer to push right-side items (if any) to the end */}
          <Box sx={{ flexGrow: 1 }} />

          {/* 3. RIGHT SIDE ITEMS (Optional) */}
          {/* <Avatar sx={{ width: 24, height: 24 }} /> */}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {/* Ensure your Sidebar component has a top margin or spacer internally if needed */}
      <Sidebar />

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* THE FIX: Pushes content down so it's not hidden behind the header */}
        <Box sx={{ height: HEADER_HEIGHT }} />

        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;
