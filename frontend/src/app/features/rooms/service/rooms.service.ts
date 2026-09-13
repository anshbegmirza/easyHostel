import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Room {
  id: string;
  code: string;
  capacity: number;
  status: string;
  occupied?: number;
}

export interface Allocation {
  id: string;
  room_id: string;
  user_id: string;
  room_code: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
}

export interface TenantOption {
  id: string;
  name: string;
  email: string;
  username?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RoomsService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ rooms: Room[] }>('/rooms');
  }

  create(body: { code: string; capacity: number; status?: string }) {
    return this.http.post<{ room: Room }>('/rooms', body);
  }

  update(id: string, body: Partial<{ code: string; capacity: number; status: string }>) {
    return this.http.patch<{ room: Room }>(`/rooms/${id}`, body);
  }

  mine() {
    return this.http.get<{ allocation: Allocation | null; room: Room | null }>('/rooms/mine');
  }

  tenants(availableOnly = false) {
    const q = availableOnly ? '?available=1' : '';
    return this.http.get<{ tenants: TenantOption[] }>(`/rooms/tenants${q}`);
  }

  allocations(roomId: string) {
    return this.http.get<{ allocations: Allocation[] }>(`/rooms/${roomId}/allocations`);
  }

  allocate(body: { room_id: string; user_id: string; start_date?: string }) {
    return this.http.post<{ allocation: Allocation }>('/rooms/allocate', body);
  }

  release(allocationId: string) {
    return this.http.post<{ ok: boolean }>('/rooms/release', { allocation_id: allocationId });
  }
}
