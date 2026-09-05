import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { AppConfigService } from './core/config/app-config.service';
import { ThemeService } from './core/theme/theme.service';

function initApp() {
  const config = inject(AppConfigService);
  const theme = inject(ThemeService);
  return () =>
    config.load().then(() => {
      // touch ThemeService so brand classes apply after config load
      theme.colorMode();
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
