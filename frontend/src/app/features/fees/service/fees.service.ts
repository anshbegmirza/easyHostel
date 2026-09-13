import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Fee {
  id: string;
  user_id: string;
  tenant_name: string | null;
  tenant_email: string | null;
  period_label: string;
  amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  fee_id: string;
  amount: number;
  method: string | null;
  paid_at: string;
  period_label: string | null;
  tenant_name: string | null;
}

@Injectable({ providedIn: 'root' })
export class FeesService {
  readonly http = inject(HttpClient);

  list() {
    return this.http.get<{ fees: Fee[] }>('/fees');
  }

  create(body: { user_id: string; period_label: string; amount: number; due_date?: string }) {
    return this.http.post<{ fee: Fee }>('/fees', body);
  }

  updateStatus(feeId: string, body: { status: string; method?: string }) {
    return this.http.patch<{ fee: Fee }>(`/fees/${feeId}`, body);
  }

  receipt(feeId: string) {
    return this.http.get<{
      fee: Fee;
      payment: Payment | null;
      hostel: { name: string; partner: string; address: string | null };
    }>(`/fees/${feeId}/receipt`);
  }
}
