import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  readonly http = inject(HttpClient);

  download(kind: 'occupancy' | 'fees' | 'complaints', format: 'xlsx' | 'pdf') {
    return this.http.get(`/reports/${kind}.${format}`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
