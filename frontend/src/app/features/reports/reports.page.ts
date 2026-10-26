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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Chart } from 'chart.js';
import { ToastService } from '../../core/toast.service';
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
import { ReportsService, ReportsSummary } from './service/reports.service';

@Component({
  selector: 'app-reports-page',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  readonly api = inject(ReportsService);
  private readonly injector = inject(Injector);
  private readonly toast = inject(ToastService);

  @ViewChild('occCanvas') occCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('feesCanvas') feesCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('complaintsCanvas') complaintsCanvas?: ElementRef<HTMLCanvasElement>;

  readonly loading = signal(true);
  readonly summary = signal<ReportsSummary | null>(null);
  readonly updatedAt = signal<Date | null>(null);

  readonly occupancyTotal = occupancyTotal;
  readonly occupancyPct = occupancyPct;
  readonly complaintsTotal = complaintsTotal;
  readonly occupancyLegend = occupancyLegend;
  readonly feesLegend = feesLegend;
  readonly complaintsLegend = complaintsLegend;

  private charts: Chart[] = [];

  ngOnInit() {
    this.api.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.updatedAt.set(new Date());
        this.loading.set(false);
        afterNextRender(() => this.renderCharts(s), { injector: this.injector });
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    destroyCharts(this.charts);
    this.charts = [];
  }

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
        this.toast.success(`${kind} ${format.toUpperCase()} downloaded`);
      },
    });
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
