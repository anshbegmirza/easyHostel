import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from '../shared/toast/toast.component';

export type ToastKind = 'success' | 'error' | 'warning';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4500) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  private show(message: string, kind: ToastKind, duration: number) {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { message, kind },
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['toast-panel'],
    });
  }
}
