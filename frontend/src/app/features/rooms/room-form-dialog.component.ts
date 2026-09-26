import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-room-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './room-form-dialog.component.html',
  styleUrl: './room-form-dialog.component.scss',
})
export class RoomFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RoomFormDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    capacity: [1, [Validators.required, Validators.min(1)]],
  });

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
