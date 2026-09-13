import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusIconComponent } from '../status-icon.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from './h4-table.types';

function readField(row: unknown, path?: string) {
  if (!path || row == null || typeof row !== 'object') {
    return null;
  }
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc == null || typeof acc !== 'object') {
      return null;
    }
    return (acc as Record<string, unknown>)[key];
  }, row);
}

function isStatusCol(col: { key: string; field?: string; statusField?: string }) {
  return col.key === 'status' || col.field === 'status' || col.statusField === 'status';
}

@Component({
  selector: 'app-h4-table',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    StatusIconComponent,
  ],
  templateUrl: './h4-table.component.html',
  styleUrl: './h4-table.component.scss',
})
export class H4TableComponent<T extends object = Record<string, unknown>> {
  @Input({ required: true }) rows: T[] = [];
  @Input({ required: true }) columns: H4TableColumn<T>[] = [];
  @Input() actions: H4TableAction<T>[] = [];
  @Input() filters: H4TableFilter[] = [];
  @Input() loading = false;
  @Input() emptyIcon = 'inbox';
  @Input() emptyText = 'No data';
  @Input() searchPlaceholder = 'Search';
  /** Fields included in free-text search (in addition to all text columns) */
  @Input() searchFields: string[] = [];

  @Output() actionClick = new EventEmitter<{ actionId: string; row: T }>();
  @Output() rowClick = new EventEmitter<T>();

  readonly search = signal('');
  readonly filterValues = signal<Record<string, string>>({});

  readonly visibleColumns = computed(() => {
    const cols = this.columns.filter((c) => !c.hidden);
    return [...cols].sort((a, b) => Number(isStatusCol(b)) - Number(isStatusCol(a)));
  });

  readonly displayedKeys = computed(() => {
    const keys = this.visibleColumns().map((c) => c.key);
    if (this.actions.length) {
      keys.push('actions');
    }
    return keys;
  });

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const fv = this.filterValues();

    return this.rows.filter((row) => {
      for (const f of this.filters) {
        const selected = fv[f.key];
        if (!selected) {
          continue;
        }
        const val = String(readField(row, f.field) ?? '');
        if (val !== selected) {
          return false;
        }
      }

      if (!q) {
        return true;
      }

      const fields = [
        ...this.searchFields,
        ...this.visibleColumns()
          .filter((c) => c.type !== 'status')
          .map((c) => c.field || c.key),
      ];

      return fields.some((field) => {
        const raw = readField(row, field);
        return String(raw ?? '')
          .toLowerCase()
          .includes(q);
      });
    });
  });

  setFilter(key: string, value: string) {
    this.filterValues.update((curr) => ({ ...curr, [key]: value }));
  }

  onRowClick(row: T) {
    if (this.rowClick.observed) {
      this.rowClick.emit(row);
    }
  }

  display(row: T, col: H4TableColumn<T>) {
    if (col.cell) {
      return col.cell(row);
    }
    return readField(row, col.field || col.key);
  }

  statusValue(row: T, col: H4TableColumn<T>) {
    return String(readField(row, col.statusField || col.field || col.key) ?? '');
  }

  asNumber(value: unknown) {
    return Number(value || 0);
  }

  asDate(value: unknown) {
    if (value == null || value === '') {
      return null;
    }
    return value as string | number | Date;
  }
}
