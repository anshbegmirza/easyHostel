import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DashboardSummary {
  occupancy: {
    total_rooms: number;
    total_beds: number;
    occupied_beds: number;
    maintenance_rooms: number;
  };
  dues: { pending_count: number; pending_amount: number };
  complaints: { open_count: number };
  my_room: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly http = inject(HttpClient);

  summary() {
    return this.http.get<DashboardSummary>('/dashboard');
  }
}
