import React, { useState } from 'react';
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
  useTheme,
  TextField,
  InputAdornment,
  TableSortLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { ColumnDef, ResourceTableProps } from '../../../interfaces/common';
import { useSettings } from '../../../context/SettingsContext';

type SortDirection = 'asc' | 'desc';

// --- Helper Functions ---

const getByPath = (obj: any, path: string) => {
  // If path is "metadata.name", split it into ["metadata", "name"]
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    // If we hit a dead end (undefined/null), stop and return empty string
    if (!current) return '';
    current = current[key];
  }

  // If the result is null/undefined, return empty string, otherwise return the data
  return current ?? '';
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

function ResourceTable({ config, data, onAction, resourceType }: ResourceTableProps) {
  const theme = useTheme();
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>('metadata.name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const { deleteEnabled } = useSettings();

  // State for Action Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<any | null>(null);

  // 1. Computed: Namespace List
  const namespaces = data.map((p: any) => p?.metadata?.namespace || '');
  const namespaceList = Array.from(new Set(namespaces)).filter(Boolean).sort() as string[];

  // 2. Computed: Filtered & Sorted
  const processedData = [...data]
    .filter((item: any) => {
      const nsMatch = selectedNamespaces.length === 0 || selectedNamespaces.includes(item?.metadata?.namespace);
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = !searchQuery || (item?.metadata?.name ?? '').toLowerCase().includes(searchLower);
      return nsMatch && nameMatch;
    })
    .sort((a: any, b: any) => {
      const col = config.columns.find((c) => c.key === sortKey);
      const valA = col?.sortValue ? col.sortValue(a) : (getByPath(a, sortKey) ?? '');
      const valB = col?.sortValue ? col.sortValue(b) : (getByPath(b, sortKey) ?? '');
      const cmp = typeof valA === 'number' && typeof valB === 'number' ? valA - valB : String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // Handlers
  const handleNamespaceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedNamespaces(typeof value === 'string' ? value.split(',') : value);
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

  const handleSortClick = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleActionClick = (actionId: string) => {
    if (onAction && activeRow) {
      onAction(actionId, activeRow);
    }
    handleMenuClose();
  };

  const getRowStyle = (row: any) => {
    if (row?.metadata?.deletionTimestamp) {
      return { backgroundColor: alpha(theme.palette.error.main, 0.5), opacity: 0.7 };
    }
    return {};
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1, // Take remaining space
        minHeight: 0, // Allow shrinking for scroll
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // ensure items start at top
      }}
    >
      {/* 1. Filter Section */}
      <Box sx={{ pt: 1, pb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {resourceType !== 'namespaces' && (
          <FormControl size="small" sx={{ minWidth: 150, maxWidth: 300 }}>
            <InputLabel size="small">Namespace</InputLabel>
            <Select multiple value={selectedNamespaces} onChange={handleNamespaceChange} renderValue={(selected) => selected.join(', ')} label="Namespace">
              {namespaceList.map((ns) => (
                <MenuItem key={ns} value={ns}>
                  <Checkbox checked={selectedNamespaces.indexOf(ns) > -1} size="small" />
                  <ListItemText primary={ns} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      {/* 2. Table Section */}
      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 0, // Don't grow if content is small
          flexShrink: 1, // Shrink if content is large (to trigger scroll)
          minHeight: 0, // Allow shrinking
          overflow: 'auto',
        }}
      >
        <Table stickyHeader size="small" aria-label="k8s table">
          <TableHead>
            <TableRow>
              {config.columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 'bold' }} sortDirection={sortKey === col.key ? sortDir : false}>
                  <TableSortLabel active={sortKey === col.key} direction={sortKey === col.key ? sortDir : 'asc'} onClick={() => handleSortClick(col.key)}>
                    {col.header}
                  </TableSortLabel>
                </TableCell>
              ))}
              {(config.actions?.length ?? 0) > 0 && (
                <TableCell align="right" sx={{ fontWeight: 'bold', width: 50 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.map((row: any, index: number) => (
              <TableRow key={row?.object?.metadata?.uid || index} hover sx={getRowStyle(row)}>
                {config.columns.map((col) => {
                  const val = getValue(row, col);
                  // Check if it's our custom status object
                  const isStatusObj = val && typeof val === 'object' && 'kind' in val && (val as any).kind === 'status';

                  return (
                    <TableCell key={col.key}>
                      {isStatusObj ? (
                        <Chip
                          label={(val as any).label}
                          color={(val as any).cssClass}
                          size="small"
                          variant="filled"
                          sx={{
                            fontFamily: '"Montserrat", sans-serif',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        val
                      )}
                    </TableCell>
                  );
                })}

                {(config.actions?.length ?? 0) > 0 && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {processedData.length === 0 && (
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
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} onClick={(e) => e.stopPropagation()}>
        {(config.actions ?? []).map((action) => {
          const isDelete = action.id === 'delete';
          const isDisabled = isDelete && !deleteEnabled;

          return (
            <MenuItem
              key={action.id}
              onClick={() => !isDisabled && handleActionClick(action.id)}
              disabled={isDisabled}
              sx={{
                color: isDelete ? 'error.main' : 'inherit',
                '&.Mui-disabled': {
                  opacity: 0.45,
                },
              }}
            >
              {action.icon && (
                <action.icon
                  sx={{
                    mr: 1,
                    fontSize: 20,
                    color: isDelete ? 'error.main' : 'inherit',
                  }}
                />
              )}
              {action.label}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

export default ResourceTable;
