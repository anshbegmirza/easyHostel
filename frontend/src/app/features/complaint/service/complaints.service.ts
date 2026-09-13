import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Complaint {
  id: string;
  user_id: string;
  tenant_name: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  sla_due_at: string | null;
  sla_breached: boolean;
  has_photo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplaintEvent {
  id: string;
  status: string;
  note: string | null;
  actor_name: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintsService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ complaints: Complaint[] }>('/complaints');
  }

  get(id: string) {
    return this.http.get<{ complaint: Complaint; events: ComplaintEvent[] }>(`/complaints/${id}`);
  }

  create(form: FormData) {
    return this.http.post<{ complaint: Complaint; events: ComplaintEvent[] }>('/complaints', form);
  }

  photo(id: string) {
    return this.http.get(`/complaints/${id}/photo`, { responseType: 'blob' });
  }

  updateStatus(id: string, body: { status: string; note?: string }) {
    return this.http.patch<{ complaint: Complaint; events: ComplaintEvent[] }>(
      `/complaints/${id}/status`,
      body
    );
  }
}
