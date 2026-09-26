import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Room, TenantOption } from './service/rooms.service';

@Component({
  selector: 'app-allocate-room-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './allocate-room-dialog.component.html',
  styleUrl: './allocate-room-dialog.component.scss',
})
export class AllocateRoomDialogComponent {
  readonly data = inject<{ room: Room; tenants: TenantOption[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AllocateRoomDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
