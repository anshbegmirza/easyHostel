import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ReportsSummary {
  occupancy: { occupied: number; free: number };
  fees: { due: number; paid: number; waived: number; due_amount: number };
  complaints: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  readonly http = inject(HttpClient);

  summary() {
    return this.http.get<ReportsSummary>('/reports/summary');
  }

  download(kind: 'occupancy' | 'fees' | 'complaints', format: 'xlsx' | 'pdf') {
    return this.http.get(`/reports/${kind}.${format}`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
