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
  template: `
    <h2 mat-dialog-title>Continue with Google (test)</h2>
    <mat-dialog-content>
      <p class="hint">
        Test mode: enter the Google account details you want to use. In production this
        uses real Google Sign-In.
      </p>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" autocomplete="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Google email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">
        Continue
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .hint {
      margin: 0 0 1rem;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: min(100%, 320px);
    }
  `,
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
