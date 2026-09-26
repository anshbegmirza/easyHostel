import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TenantOption } from '../rooms/service/rooms.service';

@Component({
  selector: 'app-parent-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './parent-form-dialog.component.html',
  styleUrl: './parent-form-dialog.component.scss',
})
export class ParentFormDialogComponent {
  readonly data = inject<{ tenants: TenantOption[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ParentFormDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    password: ['changeme'],
    tenantIds: [[] as string[], Validators.required],
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
