import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ notifications: AppNotification[]; unread: number }>('/notifications');
  }

  markRead(id: string) {
    return this.http.post<{ ok: boolean }>(`/notifications/${id}/read`, {});
  }

  markAllRead() {
    return this.http.post<{ ok: boolean }>('/notifications/read-all', {});
  }
}
