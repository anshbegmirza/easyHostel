import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-room-change-request-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './room-change-request-dialog.component.html',
  styleUrl: './room-change-request-dialog.component.scss',
})
export class RoomChangeRequestDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RoomChangeRequestDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
