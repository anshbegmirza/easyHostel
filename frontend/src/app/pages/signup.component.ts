import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AppConfigService } from '../core/config/app-config.service';
import { AuthService } from '../core/authentication/auth.service';
import { ThemeService } from '../core/theme/theme.service';
import { loadGoogleIdentityScript } from '../core/authentication/google-identity';
import { TestGoogleDialogComponent } from './test-google-dialog.component';

@Component({
  selector: 'app-signup',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef;

  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  appConfig = inject(AppConfigService);
  theme = inject(ThemeService);

  loading = signal(false);
  error = signal('');
  success = signal('');
  useRealGoogle = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    const clientId = this.appConfig.config().googleClientId?.trim();
    this.useRealGoogle.set(!!clientId);
    if (clientId) {
      this.mountGoogleButton(clientId);
    }
  }

  submitRegister() {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.auth
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.success.set(res.message || 'Registration submitted. Await admin approval.');
          this.form.reset({ name: '', email: '', username: '', password: '' });
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Registration failed.');
        },
      });
  }

  continueWithGoogleTest() {
    this.dialog
      .open(TestGoogleDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.finishGoogle({ email: result.email, name: result.name });
      });
  }

  private async mountGoogleButton(clientId: string) {
    try {
      await loadGoogleIdentityScript();
      setTimeout(() => {
        const host = this.googleBtnHost?.nativeElement;
        if (!host || !window.google?.accounts?.id) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            this.finishGoogle({ id_token: response.credential });
          },
        });
        host.innerHTML = '';
        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'signup_with',
        });
      }, 0);
    } catch {
      this.useRealGoogle.set(false);
    }
  }

  private finishGoogle(payload: { id_token?: string; email?: string; name?: string }) {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.auth
      .loginWithGoogle(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.router.navigateByUrl(this.auth.homePathForRole(res.user.role));
        },
        error: (err) => {
          const code = err?.error?.code;
          if (code === 'PENDING_APPROVAL') {
            this.success.set(err?.error?.message || 'Account pending admin approval.');
            this.error.set('');
            return;
          }
          this.error.set(err?.error?.message || 'Google sign-up failed.');
        },
      });
  }
}
