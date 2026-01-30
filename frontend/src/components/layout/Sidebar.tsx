import { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import DnsIcon from "@mui/icons-material/Dns";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { sidebarItems, iconMapping } from "./sidebarConfig";

const drawerWidth = 280;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(
    {},
  );

  const handleToggle = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto", py: 2 }}>
        <List component="nav">
          {sidebarItems.map((group) => {
            const isChildActive = group.items.some(
              (item) => item.route === location.pathname,
            );
            const isOpen = openSections[group.title] || isChildActive;

            return (
              <div key={group.title}>
                {/* Group Header (Clickable) */}
                <ListItemButton
                  onClick={() => handleToggle(group.title)}
                  sx={{
                    bgcolor: isChildActive ? "action.selected" : "inherit",
                    fontWeight: isChildActive ? 600 : 400,
                  }}
                >
                  <ListItemIcon>
                    {iconMapping[group.icon] || <DnsIcon />}
                  </ListItemIcon>
                  <ListItemText primary={group.title} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                {/* Nested Items (Collapsible) */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List
                    component="div"
                    disablePadding
                    sx={{
                      ml: 2,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      bgcolor: "action.hover",
                      py: 0.5,
                    }}
                  >
                    {group.items.map((subItem) => (
                      <ListItemButton
                        key={subItem.route}
                        selected={location.pathname === subItem.route}
                        onClick={() => navigate(subItem.route)}
                        sx={{
                          pl: 3,
                          py: 0.75,
                          borderRadius: 1,
                          mx: 1,
                          "&.Mui-selected": {
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            "& .MuiListItemIcon-root": {
                              color: "primary.contrastText",
                            },
                          },
                          "&:hover": {
                            bgcolor: "action.selected",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: "text.secondary",
                          }}
                        >
                          {iconMapping[subItem.icon] || <DashboardIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={subItem.label}
                          slotProps={{
                            primary: {
                              fontSize: "0.85rem",
                              fontWeight: 400,
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </div>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
