import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-complaint-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './complaint-dialog.component.html',
  styleUrl: './complaint-dialog.component.scss',
})
export class ComplaintDialogComponent {
  readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<ComplaintDialogComponent>);
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium', Validators.required],
  });
  photo: File | null = null;

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.photo = input.files?.[0] || null;
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close({ ...this.form.getRawValue(), photo: this.photo });
  }
}
