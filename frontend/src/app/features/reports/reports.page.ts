import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReportsService } from './service/reports.service';

@Component({
  selector: 'app-reports-page',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPageComponent {
  readonly api = inject(ReportsService);

  readonly kinds = [
    { kind: 'occupancy' as const, label: 'Occupancy', hint: 'Rooms, capacity, occupied beds' },
    { kind: 'fees' as const, label: 'Fees', hint: 'Dues, paid, and waived ledger' },
    { kind: 'complaints' as const, label: 'Complaints', hint: 'Tickets with priority and SLA' },
  ];

  download(kind: 'occupancy' | 'fees' | 'complaints', format: 'xlsx' | 'pdf') {
    this.api.download(kind, format).subscribe({
      next: (res) => {
        const blob = res.body;
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${kind}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
