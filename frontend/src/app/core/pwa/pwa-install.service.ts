import { Injectable, computed, signal } from '@angular/core';

const DISMISS_KEY = 'hms-pwa-install-dismiss';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferred: BeforeInstallPromptEvent | null = null;

  readonly isStandalone = signal(this.readStandalone());
  readonly canNativeInstall = signal(false);
  readonly showIosHint = signal(false);
  private readonly dismissed = signal(localStorage.getItem(DISMISS_KEY) === '1');

  readonly showBanner = computed(
    () =>
      !this.isStandalone() &&
      !this.dismissed() &&
      (this.canNativeInstall() || this.showIosHint())
  );

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      if (!this.dismissed()) {
        this.canNativeInstall.set(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canNativeInstall.set(false);
      this.isStandalone.set(true);
    });

    if (!this.dismissed() && this.isIosSafari() && !this.isStandalone()) {
      this.showIosHint.set(true);
    }
  }

  async install(): Promise<boolean> {
    if (!this.deferred) {
      return false;
    }
    await this.deferred.prompt();
    const { outcome } = await this.deferred.userChoice;
    this.deferred = null;
    this.canNativeInstall.set(false);
    if (outcome === 'accepted') {
      this.isStandalone.set(true);
      return true;
    }
    return false;
  }

  dismiss(): void {
    this.dismissed.set(true);
    this.canNativeInstall.set(false);
    this.showIosHint.set(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  private readStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private isIosSafari(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    return ios && !/(crios|fxios|edgios)/.test(ua);
  }
}
