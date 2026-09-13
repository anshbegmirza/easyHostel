import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Fee, FeesService, Payment } from './service/fees.service';

@Component({
  selector: 'app-receipt-page',
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './receipt.page.html',
  styleUrl: './receipt.page.scss',
})
export class ReceiptPageComponent implements OnInit {
  readonly api = inject(FeesService);
  readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly fee = signal<Fee | null>(null);
  readonly payment = signal<Payment | null>(null);
  readonly hostelName = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.api.receipt(id).subscribe({
      next: (res) => {
        this.fee.set(res.fee);
        this.payment.set(res.payment);
        this.hostelName.set(res.hostel.name);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  print() {
    window.print();
  }
}
