import { DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Chart } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/authentication/auth.service';
import { isParentRole, isStaffRole } from '../../core/roles';
import {
  complaintsLegend,
  complaintsTotal,
  createReportCharts,
  destroyCharts,
  feesLegend,
  occupancyLegend,
  occupancyPct,
  occupancyTotal,
} from '../../shared/report-charts';
import { ReportsService, ReportsSummary } from '../reports/service/reports.service';
import { DashboardService, DashboardSummary } from './service/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [DecimalPipe, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly api = inject(DashboardService);
  private readonly reportsApi = inject(ReportsService);
  private readonly injector = inject(Injector);

  @ViewChild('occCanvas') occCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('feesCanvas') feesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('complaintsCanvas') complaintsCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly chartSummary = signal<ReportsSummary | null>(null);
  readonly staff = signal(false);
  readonly parent = signal(false);
  readonly showCharts = signal(false);

  readonly occupancyTotal = occupancyTotal;
  readonly occupancyPct = occupancyPct;
  readonly complaintsTotal = complaintsTotal;
  readonly occupancyLegend = occupancyLegend;
  readonly feesLegend = feesLegend;
  readonly complaintsLegend = complaintsLegend;

  private charts: Chart[] = [];

  ngOnInit() {
    const role = this.auth.user()?.role;
    const staff = isStaffRole(role);
    this.staff.set(staff);
    this.parent.set(isParentRole(role));
    this.showCharts.set(staff);

    forkJoin({
      dash: this.api.summary(),
      charts: staff
        ? this.reportsApi.summary().pipe(catchError(() => of(null)))
        : of(null),
    }).subscribe({
      next: ({ dash, charts }) => {
        this.summary.set(dash);
        this.chartSummary.set(charts);
        this.loading.set(false);
        if (charts) {
          afterNextRender(() => this.renderCharts(charts), { injector: this.injector });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    destroyCharts(this.charts);
    this.charts = [];
  }

  private renderCharts(s: ReportsSummary) {
    destroyCharts(this.charts);
    const occupancy = this.occCanvas?.nativeElement;
    const fees = this.feesCanvas?.nativeElement;
    const complaints = this.complaintsCanvas?.nativeElement;
    if (!occupancy || !fees || !complaints) {
      return;
    }
    this.charts = createReportCharts({ occupancy, fees, complaints }, s);
  }
}
