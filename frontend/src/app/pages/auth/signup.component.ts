import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AppConfigService } from '../../core/config/app-config.service';
import { AuthService } from '../../core/authentication/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { loadGoogleIdentityScript } from '../../core/authentication/google-identity';
import { TestGoogleDialogComponent } from './test-google-dialog.component';

@Component({
  selector: 'app-signup',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  @ViewChild('googleBtnHost') googleBtnHost?: ElementRef;

  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  appConfig = inject(AppConfigService);
  theme = inject(ThemeService);

  loading = signal(false);
  error = signal('');
  useRealGoogle = signal(false);

  ngOnInit() {
    const clientId = this.appConfig.config().googleClientId?.trim();
    this.useRealGoogle.set(!!clientId);
    if (clientId) {
      this.mountGoogleButton(clientId);
    }
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
            this.finishGoogle({ idToken: response.credential });
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

  private finishGoogle(payload: { idToken?: string; email?: string; name?: string }) {
    this.loading.set(true);
    this.error.set('');
    this.auth
      .loginWithGoogle(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.router.navigateByUrl(this.auth.homePathForRole(res.user.role));
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Google sign-up failed.');
        },
      });
  }
}
