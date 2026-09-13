import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardSummary } from './service/dashboard.service';
import { AuthService } from '../../core/authentication/auth.service';
import { isParentRole, isStaffRole } from '../../core/roles';

@Component({
  selector: 'app-dashboard-page',
  imports: [DecimalPipe, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly api = inject(DashboardService);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly staff = signal(false);
  readonly parent = signal(false);

  ngOnInit() {
    const role = this.auth.user()?.role;
    this.staff.set(isStaffRole(role));
    this.parent.set(isParentRole(role));
    this.api.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
