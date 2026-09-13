export interface H4TableColumn<T = unknown> {
  key: string;
  header: string;
  /** Dot-path or key on row */
  field?: string;
  type?: 'text' | 'strong' | 'status' | 'currency' | 'date';
  /** Hide column (e.g. tenant for non-staff) */
  hidden?: boolean;
  cell?: (row: T) => string | number | null | undefined;
  /** For type=status — which field holds the status string */
  statusField?: string;
}

export interface H4TableFilterOption {
  value: string;
  label: string;
}

export interface H4TableFilter {
  key: string;
  label: string;
  /** Field on row to match against */
  field: string;
  options: H4TableFilterOption[];
  /** Empty value means All */
  allLabel?: string;
}

export interface H4TableAction<T = unknown> {
  id: string;
  icon: string;
  tooltip: string;
  color?: 'primary' | 'accent' | 'warn' | '';
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}
