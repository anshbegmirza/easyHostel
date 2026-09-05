import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs/operators';
import { AppConfigService } from '../../core/config/app-config.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TestGoogleDialogComponent } from './test-google-dialog.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly appConfig = inject(AppConfigService);
  readonly theme = inject(ThemeService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['superuser', Validators.required],
    password: ['test@123', Validators.required],
    remember: [true],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { username, password, remember } = this.form.getRawValue();
    this.auth
      .login(username, password, remember)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/'),
        error: (err) =>
          this.error.set(err?.error?.message || 'Incorrect username or password.'),
      });
  }

  continueWithGoogle(): void {
    const cfg = this.appConfig.config();
    if (cfg.googleClientId) {
      this.error.set('Wire Google Identity Services with the configured client id next.');
      return;
    }

    this.dialog
      .open(TestGoogleDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.auth
          .loginWithGoogle(result)
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => void this.router.navigateByUrl('/'),
            error: (err) =>
              this.error.set(err?.error?.message || 'Google sign-in failed.'),
          });
      });
  }
}
