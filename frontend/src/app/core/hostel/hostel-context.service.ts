import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'eh4-hostel-partner';

@Injectable({ providedIn: 'root' })
export class HostelContextService {
  partner = signal(this.readInitial());

  setPartner(partner: string) {
    const normalized = (partner || 'hogwarts').trim().toLowerCase();
    this.partner.set(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
  }

  private readInitial() {
    return localStorage.getItem(STORAGE_KEY) || 'hogwarts';
  }
}
