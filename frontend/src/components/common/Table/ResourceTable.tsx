import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  IconButton,
  Menu,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { ColumnDef, ResourceTableProps } from "../../../interfaces/common";

// --- Helper Functions ---

const getByPath = (obj: any, path: string) => {
  // If path is "metadata.name", split it into ["metadata", "name"]
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    // If we hit a dead end (undefined/null), stop and return empty string
    if (!current) return "";
    current = current[key];
  }

  // If the result is null/undefined, return empty string, otherwise return the data
  return current ?? "";
};

// Explicitly saying it returns ReactNode allows strings OR components
function getValue(row: any, col: ColumnDef): React.ReactNode {
  // 1. If there is a custom function (like for Age or Status), run it.
  if (col.accessor) {
    return col.accessor(row);
  }

  // 2. Otherwise, just fetch the raw data string from the object
  return getByPath(row, col.key);
}

// --- Main Component ---

function ResourceTable({
  config,
  data,
  onAction,
  resourceType,
}: ResourceTableProps) {
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);

  // State for Action Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<any | null>(null);

  // 1. Computed: Namespace List
  const namespaces = data.map((p: any) => p?.metadata?.namespace || "");
  const namespaceList = Array.from(new Set(namespaces))
    .filter(Boolean)
    .sort() as string[];

  // 2. Computed: Filtered & Sorted
  const sorted = [...data].sort((a: any, b: any) => {
    const nsA = a?.metadata?.namespace ?? "";
    const nsB = b?.metadata?.namespace ?? "";
    const nsCompare = nsA.localeCompare(nsB);
    if (nsCompare !== 0) return nsCompare;
    return (a?.metadata?.name ?? "").localeCompare(b?.metadata?.name ?? "");
  });

  const filteredData =
    selectedNamespaces.length === 0
      ? sorted
      : sorted.filter((item: any) =>
          selectedNamespaces.includes(item?.metadata?.namespace),
        );

  // Handlers
  const handleNamespaceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedNamespaces(typeof value === "string" ? value.split(",") : value);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRow(null);
  };

  const handleActionClick = (actionId: string) => {
    if (onAction && activeRow) {
      onAction(actionId, activeRow);
    }
    handleMenuClose();
  };

  const getRowStyle = (row: any) => {
    if (row?.metadata?.deletionTimestamp) {
      return { backgroundColor: "#cd3d53ff", opacity: 0.7 };
    }
    return {};
  };

  return (
    <Box
      sx={{
        width: "100%",
        flexGrow: 1, // Take remaining space
        minHeight: 0, // Allow shrinking for scroll
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start", // ensure items start at top
      }}
    >
      {/* 1. Filter Section */}
      {resourceType !== "namespaces" && (
        <Box
          sx={{
            pt: 1,
            pb: 2,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          {" "}
          {/* 1. Aligns content to left */}
          <FormControl
            size="small" // 2. Makes the height smaller (compact mode)
            sx={{ minWidth: 150, maxWidth: 300 }} // 3. Reduced width (was 200/400)
          >
            <InputLabel size="small">Namespace</InputLabel>{" "}
            {/* 4. Ensure label matches small size */}
            <Select
              multiple
              value={selectedNamespaces}
              onChange={handleNamespaceChange}
              renderValue={(selected) => selected.join(", ")}
              label="Namespace"
              // size="small" is inherited from FormControl, but you can add it here too to be safe
            >
              {namespaceList.map((ns) => (
                <MenuItem key={ns} value={ns}>
                  <Checkbox
                    checked={selectedNamespaces.indexOf(ns) > -1}
                    size="small"
                  />{" "}
                  {/* Optional: make checkbox small too */}
                  <ListItemText primary={ns} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      {/* 2. Table Section */}
      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 0, // Don't grow if content is small
          flexShrink: 1, // Shrink if content is large (to trigger scroll)
          minHeight: 0, // Allow shrinking
          overflow: "auto",
        }}
      >
        <Table stickyHeader size="small" aria-label="k8s table">
          <TableHead>
            <TableRow>
              {config.columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: "bold" }}>
                  {col.header}
                </TableCell>
              ))}
              {(config.actions?.length ?? 0) > 0 && (
                <TableCell align="right" sx={{ fontWeight: "bold", width: 50 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row: any, index: number) => (
              <TableRow
                key={row?.object?.metadata?.uid || index}
                hover
                sx={getRowStyle(row)}
              >
                {config.columns.map((col) => {
                  const val = getValue(row, col);
                  // Check if it's our custom status object
                  const isStatusObj =
                    val &&
                    typeof val === "object" &&
                    "kind" in val &&
                    (val as any).kind === "status";

                  return (
                    <TableCell key={col.key}>
                      {isStatusObj ? (
                        <Chip
                          label={(val as any).label}
                          color={(val as any).cssClass}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        val
                      )}
                    </TableCell>
                  );
                })}

                {(config.actions?.length ?? 0) > 0 && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, row)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1} align="center">
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 3. Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {(config.actions ?? []).map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleActionClick(action.id)}
          >
            {action.icon && <action.icon sx={{ mr: 1, fontSize: 20 }} />}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default ResourceTable;
