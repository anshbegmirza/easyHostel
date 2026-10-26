import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import type { ToastKind } from '../../core/toast.service';

export interface ToastData {
  message: string;
  kind: ToastKind;
}

const ICONS: Record<ToastKind, string> = {
  success: 'check_circle',
  error: 'cancel',
  warning: 'warning',
};

@Component({
  selector: 'app-toast',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="toast" [attr.data-kind]="data.kind" role="status">
      <mat-icon class="toast__icon">{{ icon }}</mat-icon>
      <span class="toast__msg">{{ data.message }}</span>
      <button
        mat-icon-button
        type="button"
        class="toast__close"
        aria-label="Close"
        (click)="ref.dismiss()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 260px;
      max-width: 420px;
      padding: 10px 6px 10px 14px;
      border-radius: 8px;
      color: #fff;
      box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
    }
    .toast[data-kind='success'] {
      background: #2e7d32;
    }
    .toast[data-kind='error'] {
      background: #c62828;
    }
    .toast[data-kind='warning'] {
      background: #f9a825;
      color: #1a1a1a;
    }
    .toast__icon {
      flex-shrink: 0;
    }
    .toast__msg {
      flex: 1;
      font-size: 0.875rem;
      line-height: 1.35;
      word-break: break-word;
    }
    .toast__close {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      color: inherit;
    }
    .toast__close mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `,
})
export class ToastComponent {
  readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  readonly ref = inject(MatSnackBarRef<ToastComponent>);
  readonly icon = ICONS[this.data.kind];
}
