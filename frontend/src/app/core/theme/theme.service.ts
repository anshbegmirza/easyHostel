import { Injectable, effect, inject, signal } from '@angular/core';
import { AppConfigService } from '../config/app-config.service';
import { ColorMode } from '../config/app-config.model';
import { BrandPalette, isBrandPalette } from './theme.model';

const MODE_KEY = 'hms-color-mode';

const META_COLORS: Record<BrandPalette, { light: string; dark: string }> = {
  purple: { light: '#7b1fa2', dark: '#212121' },
  green: { light: '#2e7d32', dark: '#212121' },
  works4: { light: '#1976d2', dark: '#212121' },
  amber: { light: '#ff8f00', dark: '#212121' },
};

const PALETTE_CLASS: Record<BrandPalette, string> = {
  purple: 'brand-test',
  green: 'brand-prod',
  works4: 'brand-works4',
  amber: 'brand-amber',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly appConfig = inject(AppConfigService);

  readonly colorMode = signal<ColorMode>(this.readColorMode());
  /** From backend THEME_PALETTE / APP_MODE — not user-picked in the UI. */
  readonly brandPalette = signal<BrandPalette>('purple');

  constructor() {
    effect(() => {
      const cfg = this.appConfig.config();
      const fromBackend = isBrandPalette(cfg.themePalette)
        ? cfg.themePalette
        : cfg.mode === 'prod' || cfg.brand === 'green'
          ? 'green'
          : 'purple';
      this.brandPalette.set(fromBackend);
      this.apply(fromBackend, this.colorMode());
    });
  }

  toggleColorMode(): void {
    this.setColorMode(this.colorMode() === 'light' ? 'dark' : 'light');
  }

  setColorMode(mode: ColorMode): void {
    this.colorMode.set(mode);
    localStorage.setItem(MODE_KEY, mode);
  }

  private apply(palette: BrandPalette, mode: ColorMode): void {
    const root = document.documentElement;
    root.classList.remove('brand-test', 'brand-prod', 'brand-works4', 'brand-ocean', 'brand-amber');
    root.classList.add(PALETTE_CLASS[palette]);
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-brand', palette);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', META_COLORS[palette][mode]);
    }
  }

  private readColorMode(): ColorMode {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
