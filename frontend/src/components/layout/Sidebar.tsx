import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
  Button,
  Tooltip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DnsIcon from '@mui/icons-material/Dns';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';

import { sidebarItems, iconMapping } from './sidebarConfig';
import CreateManifestDialog from '../common/CreateManifestDialog/CreateManifestDialog';

const drawerWidth = 280;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [manifestDialogOpen, setManifestDialogOpen] = useState(false);

  const handleToggle = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: '45px !important' }} />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <List component="nav" sx={{ flex: 1, overflow: 'auto' }}>
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
                      color: 'grey',
                    }}
                  >
                    <ListItemIcon>{iconMapping[group.icon] || <DnsIcon />}</ListItemIcon>
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
                        borderColor: 'divider',
                        bgcolor: 'drawer.background',
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
                            '&.Mui-selected': {
                              bgcolor: 'action.selected',
                              color: 'primary.contrastText',
                              '& .MuiListItemIcon-root': {
                                color: 'primary.contrastText',
                              },
                            },
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 36,
                              color: 'text.secondary',
                            }}
                          >
                            {iconMapping[subItem.icon] || <DashboardIcon />}
                          </ListItemIcon>
                          <ListItemText primary={subItem.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </div>
              );
            })}
          </List>

          {/* Footer: Create Manifest FAB */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Tooltip title="Create & Apply Manifest" placement="right">
              <Button
                size="small"
                onClick={() => setManifestDialogOpen(true)}
                variant="contained"
              >
                <AddIcon />
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      {/* Create Manifest Dialog */}
      <CreateManifestDialog
        open={manifestDialogOpen}
        onClose={() => setManifestDialogOpen(false)}
      />
    </>
  );
}

export default Sidebar;
