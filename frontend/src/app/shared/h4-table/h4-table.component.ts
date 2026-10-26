import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusIconComponent } from '../status-icon.component';
import { H4TableAction, H4TableColumn, H4TableFilter } from './h4-table.types';

const MIN_LOADING_MS = 1000;

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
    MatProgressBarModule,
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
  private readonly destroyRef = inject(DestroyRef);

  readonly rows = input.required<T[]>();
  readonly columns = input.required<H4TableColumn<T>[]>();
  readonly actions = input<H4TableAction<T>[]>([]);
  readonly filters = input<H4TableFilter[]>([]);
  readonly loading = input(false);
  readonly emptyIcon = input('inbox');
  readonly emptyText = input('No data');
  readonly searchPlaceholder = input('Search');
  readonly searchFields = input<string[]>([]);

  @Output() actionClick = new EventEmitter<{ actionId: string; row: T }>();
  @Output() rowClick = new EventEmitter<T>();

  readonly search = signal('');
  readonly filterValues = signal<Record<string, string>>({});
  /** Visible loading state, held for at least MIN_LOADING_MS. */
  readonly showLoading = signal(false);
  /** Progress bar over existing rows (vs full spinner on first load). */
  readonly overlayLoading = signal(false);

  private loadingActive = false;
  private loadingStartedAt = 0;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const loading = this.loading();
      if (loading) {
        if (!this.loadingActive) {
          this.loadingActive = true;
          if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
          }
          this.loadingStartedAt = Date.now();
          this.overlayLoading.set(untracked(() => this.rows().length > 0));
          this.showLoading.set(true);
        }
        return;
      }

      if (!this.loadingActive) {
        return;
      }
      this.loadingActive = false;
      const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - this.loadingStartedAt));
      this.hideTimer = setTimeout(() => {
        this.showLoading.set(false);
        this.overlayLoading.set(false);
        this.hideTimer = null;
      }, wait);
    });

    this.destroyRef.onDestroy(() => {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
      }
    });
  }

  readonly visibleColumns = computed(() => {
    const cols = this.columns().filter((c) => !c.hidden);
    return [...cols].sort((a, b) => Number(isStatusCol(b)) - Number(isStatusCol(a)));
  });

  readonly displayedKeys = computed(() => {
    const keys = this.visibleColumns().map((c) => c.key);
    if (this.actions().length) {
      keys.push('actions');
    }
    return keys;
  });

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const fv = this.filterValues();
    const filters = this.filters();
    const searchFields = this.searchFields();

    return this.rows().filter((row) => {
      for (const f of filters) {
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
        ...searchFields,
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
