import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../core/pwa/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (pwa.showBanner()) {
      <div class="pwa-banner" role="region" aria-label="Install app">
        <mat-icon class="pwa-banner__icon">install_mobile</mat-icon>
        <div class="pwa-banner__text">
          @if (pwa.canNativeInstall()) {
            <strong>Install easyHostel4</strong>
            <span class="muted">Use it like a phone app — great for your demo.</span>
          } @else {
            <strong>Add to Home Screen</strong>
            <span class="muted">Tap Share, then “Add to Home Screen” in Safari.</span>
          }
        </div>
        <div class="pwa-banner__actions">
          @if (pwa.canNativeInstall()) {
            <button mat-flat-button type="button" (click)="onInstall()">Install</button>
          }
          <button mat-icon-button type="button" aria-label="Dismiss" (click)="pwa.dismiss()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .pwa-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 16px 0;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .pwa-banner__icon {
      color: var(--color-primary);
      flex-shrink: 0;
    }
    .pwa-banner__text {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 2px;
      font-size: 0.8125rem;
    }
    .pwa-banner__text strong {
      font-size: 0.875rem;
      color: var(--color-text);
    }
    .muted {
      color: var(--color-text-muted);
      line-height: 1.35;
    }
    .pwa-banner__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
  `,
})
export class PwaInstallBannerComponent {
  readonly pwa = inject(PwaInstallService);

  onInstall(): void {
    void this.pwa.install();
  }
}
