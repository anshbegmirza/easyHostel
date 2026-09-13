import { Injectable, effect, inject, signal } from '@angular/core';
import { AppConfigService } from '../config/app-config.service';
import { ColorMode } from '../config/app-config.model';

const STORAGE_KEY = 'hms-color-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly appConfig = inject(AppConfigService);
  readonly colorMode = signal<ColorMode>(this.readInitial());

  constructor() {
    effect(() => {
      const cfg = this.appConfig.config();
      const mode = this.colorMode();
      this.apply(cfg.mode === 'prod' ? 'prod' : 'test', mode);
    });
  }

  toggleColorMode(): void {
    this.setColorMode(this.colorMode() === 'light' ? 'dark' : 'light');
  }

  setColorMode(mode: ColorMode): void {
    this.colorMode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  private apply(brand: 'test' | 'prod', mode: ColorMode): void {
    const root = document.documentElement;
    root.classList.remove('brand-test', 'brand-prod', 'brand-demo');
    root.classList.add(brand === 'prod' ? 'brand-prod' : 'brand-test');
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-brand', brand);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        brand === 'prod'
          ? mode === 'dark'
            ? '#212121'
            : '#2e7d32'
          : mode === 'dark'
            ? '#212121'
            : '#7b1fa2'
      );
    }
  }

  private readInitial(): ColorMode {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
