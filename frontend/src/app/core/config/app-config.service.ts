import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config.model';
import { HostelContextService } from '../hostel/hostel-context.service';

const fallbackConfig: AppConfig = {
  appName: 'easyHostel4',
  mode: 'test',
  brand: 'purple',
  themePalette: 'purple',
  version: '0.1.0',
  googleClientId: '',
  googleEnabled: true,
  defaultHostelPartner: 'hogwarts',
  coverQuote:
    'Clarity on fees, rooms, and complaints — so nobody has to chase updates.',
  coverQuoteAuthor: 'easyHostel4',
  allowPasswordSignup: false,
  signupHint:
    'Accounts are created by a superuser, or you can sign up with Google as a tenant.',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private http = inject(HttpClient);
  private hostelContext = inject(HostelContextService);

  config = signal(fallbackConfig);
  loaded = signal(false);

  async load() {
    try {
      const cfg = await firstValueFrom(this.http.get<AppConfig>('/config'));
      const partner = cfg.defaultHostelPartner || 'hogwarts';
      this.config.set({
        ...fallbackConfig,
        ...cfg,
        defaultHostelPartner: partner,
      });
      this.hostelContext.setPartner(partner);
    } catch {
      this.config.set(fallbackConfig);
      this.hostelContext.setPartner(fallbackConfig.defaultHostelPartner);
    } finally {
      this.loaded.set(true);
    }
  }
}
