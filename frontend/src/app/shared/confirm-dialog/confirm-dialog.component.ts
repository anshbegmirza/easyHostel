import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Use `warn` for destructive actions like delete / logout. */
  confirmColor?: 'primary' | 'warn' | 'accent';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-header">
      <h2 mat-dialog-title>{{ data.title || 'Confirm' }}</h2>
      <button
        mat-icon-button
        type="button"
        class="confirm-close"
        aria-label="Close"
        [mat-dialog-close]="false"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      <p class="confirm-msg">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button
        mat-flat-button
        type="button"
        [color]="data.confirmColor || 'primary'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirm-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding-right: 4px;
    }
    .confirm-header [mat-dialog-title] {
      margin: 0;
      flex: 1;
    }
    .confirm-close {
      margin-top: 4px;
      flex-shrink: 0;
    }
    .confirm-close mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .confirm-msg {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.45;
      color: var(--color-text);
    }
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
}
