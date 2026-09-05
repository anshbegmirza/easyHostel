import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfig } from './app-config.model';

const fallbackConfig: AppConfig = {
  appName: 'Hostel Management',
  mode: 'test',
  brand: 'purple',
  version: '0.1.0',
  googleClientId: '',
  googleEnabled: true,
  coverQuote:
    'Clarity on fees, rooms, and complaints — so nobody has to chase updates.',
  coverQuoteAuthor: 'Hostel Management',
  allowPasswordSignup: false,
  signupHint:
    'Accounts are created by a superuser, or you can sign up with Google.',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  readonly config = signal<AppConfig>(fallbackConfig);
  readonly loaded = signal(false);

  async load(): Promise<void> {
    try {
      const cfg = await firstValueFrom(
        this.http.get<AppConfig>(`${environment.apiUrl}/config`)
      );
      this.config.set(cfg);
    } catch {
      this.config.set(fallbackConfig);
    } finally {
      this.loaded.set(true);
    }
  }
}
