import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/authentication/auth.service';
import { AppConfigService } from '../core/config/app-config.service';
import { ThemeService } from '../core/theme/theme.service';
import { HostelContextService } from '../core/hostel/hostel-context.service';

@Component({
  selector: 'app-shell-home',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="home">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>{{ appConfig.config().appName }}</mat-card-title>
          <mat-card-subtitle>
            {{ auth.user()?.name }} ({{ auth.user()?.role }}) · partner
            {{ hostel.partner() }} · {{ appConfig.config().mode }} /
            {{ theme.colorMode() }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>
            Phase 1 complete: MySQL auth, /api/v1, Works4-style interceptors, Google
            tenant signup. Rooms / fees / complaints come next.
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button type="button" (click)="theme.toggleColorMode()">
            <mat-icon>{{ theme.colorMode() === 'light' ? 'dark_mode' : 'light_mode' }}</mat-icon>
            Toggle theme
          </button>
          <button mat-button color="warn" type="button" (click)="auth.logout()">Log out</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .home {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: var(--color-bg);
    }
    mat-card {
      width: min(100%, 32rem);
    }
  `,
})
export class ShellHomeComponent {
  readonly auth = inject(AuthService);
  readonly appConfig = inject(AppConfigService);
  readonly theme = inject(ThemeService);
  readonly hostel = inject(HostelContextService);
}
