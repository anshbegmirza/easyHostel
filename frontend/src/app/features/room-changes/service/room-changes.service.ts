import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RoomChangeRequest {
  id: string;
  user_id: string;
  tenant_name: string | null;
  from_room_id: string | null;
  from_room_code: string | null;
  to_room_id: string | null;
  to_room_code: string | null;
  reason: string;
  status: string;
  staff_note: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class RoomChangesService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ requests: RoomChangeRequest[] }>('/room-changes');
  }

  create(body: { reason: string; to_room_id?: string }) {
    return this.http.post<{ request: RoomChangeRequest }>('/room-changes', body);
  }

  decide(
    id: string,
    body: { status: 'approved' | 'rejected'; staff_note?: string; to_room_id?: string }
  ) {
    return this.http.post<{ request: RoomChangeRequest }>(`/room-changes/${id}/decide`, body);
  }
}
