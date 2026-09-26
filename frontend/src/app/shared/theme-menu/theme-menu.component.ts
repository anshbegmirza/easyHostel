import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/theme/theme.service';

/** Light / dark toggle only — brand palette comes from backend THEME_PALETTE. */
@Component({
  selector: 'app-theme-menu',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      type="button"
      (click)="theme.toggleColorMode()"
      [matTooltip]="theme.colorMode() === 'light' ? 'Dark mode' : 'Light mode'"
      [attr.aria-label]="theme.colorMode() === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
    >
      <mat-icon>{{ theme.colorMode() === 'light' ? 'dark_mode' : 'light_mode' }}</mat-icon>
    </button>
  `,
})
export class ThemeMenuComponent {
  readonly theme = inject(ThemeService);
}
