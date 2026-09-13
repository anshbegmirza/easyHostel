import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Notice {
  id: string;
  title: string;
  body: string;
  created_by_name: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ notices: Notice[] }>('/notices');
  }

  create(body: { title: string; body: string }) {
    return this.http.post<{ notice: Notice }>('/notices', body);
  }

  remove(id: string) {
    return this.http.delete<{ ok: boolean }>(`/notices/${id}`);
  }
}
