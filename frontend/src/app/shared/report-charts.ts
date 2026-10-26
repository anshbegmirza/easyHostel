import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import type { ReportsSummary } from '../features/reports/service/reports.service';

Chart.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

export type ReportChartCanvases = {
  occupancy: HTMLCanvasElement;
  fees: HTMLCanvasElement;
  complaints: HTMLCanvasElement;
};

export function destroyCharts(charts: Chart[]) {
  for (const chart of charts) {
    chart.destroy();
  }
}

/** Mid-tone fills that stay readable on light and dark card backgrounds. */
const CHART = {
  occupied: '#5C6BC0',
  free: '#78909C',
  due: '#F59E0B',
  paid: '#2E9E6B',
  waived: '#94A3B8',
  open: '#E53935',
  inProgress: '#FB8C00',
  resolved: '#7E57C2',
  closed: '#43A047',
} as const;

export type ChartLegendItem = { label: string; color: string };

export const occupancyLegend: ChartLegendItem[] = [
  { label: 'Occupied', color: CHART.occupied },
  { label: 'Free', color: CHART.free },
];

export const feesLegend: ChartLegendItem[] = [
  { label: 'Due', color: CHART.due },
  { label: 'Paid', color: CHART.paid },
  { label: 'Waived', color: CHART.waived },
];

export const complaintsLegend: ChartLegendItem[] = [
  { label: 'Open', color: CHART.open },
  { label: 'In progress', color: CHART.inProgress },
  { label: 'Resolved', color: CHART.resolved },
  { label: 'Closed', color: CHART.closed },
];

/** Axis/label grey that stays readable on light and dark card surfaces. */
const TICK = '#9CA3AF';

export function createReportCharts(canvases: ReportChartCanvases, s: ReportsSummary): Chart[] {
  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(ctx: { label?: string; raw?: unknown; dataset: { data: unknown[] } }) {
            const value = Number(ctx.raw ?? 0);
            const total = ctx.dataset.data.reduce<number>((sum, item) => sum + Number(item), 0);
            const pct = total ? Math.round((value / total) * 100) : 0;
            return ` ${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return [
    new Chart(canvases.occupancy, {
      type: 'doughnut',
      data: {
        labels: ['Occupied', 'Free'],
        datasets: [
          {
            data: [s.occupancy.occupied, s.occupancy.free],
            backgroundColor: [CHART.occupied, CHART.free],
          },
        ],
      },
      options: doughnutOpts,
    }),
    new Chart(canvases.fees, {
      type: 'doughnut',
      data: {
        labels: ['Due', 'Paid', 'Waived'],
        datasets: [
          {
            data: [s.fees.due, s.fees.paid, s.fees.waived],
            backgroundColor: [CHART.due, CHART.paid, CHART.waived],
          },
        ],
      },
      options: doughnutOpts,
    }),
    new Chart(canvases.complaints, {
      type: 'bar',
      data: {
        labels: ['Open', 'In progress', 'Resolved', 'Closed'],
        datasets: [
          {
            label: 'Complaints',
            data: [
              s.complaints.open,
              s.complaints.in_progress,
              s.complaints.resolved,
              s.complaints.closed,
            ],
            backgroundColor: [CHART.open, CHART.inProgress, CHART.resolved, CHART.closed],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: TICK,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: TICK }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { color: TICK, precision: 0 },
            grid: { color: 'rgba(128, 128, 128, 0.25)' },
          },
        },
      },
    }),
  ];
}

export function occupancyTotal(s: ReportsSummary) {
  return s.occupancy.occupied + s.occupancy.free;
}

export function occupancyPct(s: ReportsSummary) {
  const total = occupancyTotal(s);
  return total ? Math.round((s.occupancy.occupied / total) * 100) : 0;
}

export function complaintsTotal(s: ReportsSummary) {
  return (
    s.complaints.open +
    s.complaints.in_progress +
    s.complaints.resolved +
    s.complaints.closed
  );
}
