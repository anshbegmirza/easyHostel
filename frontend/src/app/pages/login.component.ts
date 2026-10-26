import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
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
import { AppConfigService } from '../core/config/app-config.service';
import { AuthResponse, AuthService } from '../core/authentication/auth.service';
import { ToastService } from '../core/toast.service';
import { ThemeMenuComponent } from '../shared/theme-menu/theme-menu.component';
import { PwaInstallBannerComponent } from '../shared/pwa-install-banner/pwa-install-banner.component';
import { loadGoogleIdentityScript } from '../core/authentication/google-identity';
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
    ThemeMenuComponent,
    PwaInstallBannerComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  appConfig = inject(AppConfigService);

  loading = signal(false);
  error = signal('');
  useRealGoogle = signal(false);
  hidePassword = signal(true);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [true],
  });

  ngOnInit() {
    const clientId = this.appConfig.config().googleClientId?.trim();
    this.useRealGoogle.set(!!clientId);
    if (clientId) {
      this.mountGoogleButton(clientId);
    }
  }

  submit() {
    if (this.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { username, password, remember } = this.form.getRawValue();

    this.auth
      .login(username, password, remember)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.onLoginSuccess(res),
        error: (err) => {
          this.error.set(err?.error?.message || 'Incorrect username or password.');
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
          text: 'continue_with',
        });
      }, 0);
    } catch {
      this.useRealGoogle.set(false);
      this.error.set('Could not load Google Sign-In. Use test Google or check Client ID.');
    }
  }

  private finishGoogle(payload: { id_token?: string; email?: string; name?: string }) {
    this.loading.set(true);
    this.error.set('');
    this.auth
      .loginWithGoogle(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.onLoginSuccess(res),
        error: (err) => {
          this.error.set(err?.error?.message || 'Google sign-in failed.');
        },
      });
  }

  private onLoginSuccess(res: AuthResponse) {
    const name = res.user.username || res.user.name;
    this.toast.success(`Welcome ${name}`);
    this.router.navigateByUrl(this.auth.homePathForRole(res.user.role));
  }
}
