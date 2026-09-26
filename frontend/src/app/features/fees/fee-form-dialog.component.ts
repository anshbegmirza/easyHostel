import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TenantOption } from '../rooms/service/rooms.service';

@Component({
  selector: 'app-fee-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './fee-form-dialog.component.html',
  styleUrl: './fee-form-dialog.component.scss',
})
export class FeeFormDialogComponent {
  readonly data = inject<{ tenants: TenantOption[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<FeeFormDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    periodLabel: ['', Validators.required],
    amount: [8500, [Validators.required, Validators.min(1)]],
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
