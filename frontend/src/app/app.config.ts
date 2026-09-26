import { ApplicationConfig, APP_INITIALIZER, inject, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { AppConfigService } from './core/config/app-config.service';
import { ThemeService } from './core/theme/theme.service';
import { apiPrefixInterceptor } from './core/http/api-prefix.interceptor';
import { errorHandlerInterceptor } from './core/http/error-handler.interceptor';

function initApp() {
  const config = inject(AppConfigService);
  // ThemeService reads palette from config via effect once loaded
  inject(ThemeService);
  return () => config.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiPrefixInterceptor, errorHandlerInterceptor])),
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
