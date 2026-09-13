import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TestGoogleResult {
  email: string;
  name: string;
}

@Component({
  selector: 'app-test-google-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './test-google-dialog.component.html',
  styleUrl: './test-google-dialog.component.scss',
})
export class TestGoogleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<TestGoogleDialogComponent, TestGoogleResult>);

  readonly form = this.fb.nonNullable.group({
    name: ['Test Tenant', Validators.required],
    email: ['tenant@gmail.com', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.ref.close(this.form.getRawValue());
  }
}
