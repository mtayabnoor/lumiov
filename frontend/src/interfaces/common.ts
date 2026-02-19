import type { SvgIconComponent } from '@mui/icons-material';

export type CellType = 'text' | 'number' | 'duration' | 'percent';

export interface ColumnDef {
  key: string; // dot-path OR an id (unused when accessor provided)
  header: string;
  type?: CellType; // simple formatting
  accessor?: (row: any) => any; // compute value here
}

export interface ActionDef {
  id: string;
  label: string;
  icon?: SvgIconComponent;
}

export interface ResourceTableConfig {
  columns: ColumnDef[];
  actions?: ActionDef[];
}

export interface ResourceTableProps {
  config: ResourceTableConfig;
  data: any[]; // The generic wrapper DataUpdatePayload<T> is complex to type perfectly here quickly without breaking Pods, keeping any[] but casting locally or encouraging valid T. Ideally data: T[]
  // Wait, data coming in is DataUpdatePayload<Pod>[].
  // But the table iterates rows. Let's make it data: T[] and let consumer handle wrapper unwrap if needed?
  // User's existing code passes `pods` which is DataUpdatePayload<Pod>[].
  // And usage is row.object.metadata...
  // So T implies DataUpdatePayload<Pod>.
  onAction?: (actionId: string, row: any) => void;
  resourceType?: string;
}
