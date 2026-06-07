import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { ReportService } from './report.service';
import { DashboardReport, ChartSegment } from './report.types';

// Fallback demo data shown when real API data has all zeros
const DEMO_REPORT: DashboardReport = {
  totalWorkspaces: 3,
  totalBoards: 8,
  totalLists: 24,
  totalCards: 57,
  averageCardsPerList: 2.4,
  completedTasks: 18,
  inProgressTasks: 14,
  toDoTasks: 21,
  overdueTasks: 4,
  highPriorityTasks: 12,
  mediumPriorityTasks: 28,
  lowPriorityTasks: 17,
  statusBreakdown: [
    { label: 'ToDo', value: 21 },
    { label: 'InProgress', value: 14 },
    { label: 'Done', value: 18 },
  ],
  priorityBreakdown: [
    { label: 'High', value: 12 },
    { label: 'Medium', value: 28 },
    { label: 'Low', value: 17 },
  ],
  assigneeBreakdown: [
    { label: 'alice@example.com', value: 15 },
    { label: 'bob@example.com', value: 12 },
    { label: 'carol@example.com', value: 9 },
    { label: 'dave@example.com', value: 7 },
    { label: 'Unassigned', value: 14 },
  ],
};

@Component({
  selector: 'reports-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="reports-root">

      <!-- Not authenticated -->
      <div *ngIf="!auth.isAuthenticated()" class="empty-state-page">
        <span class="es-icon">📊</span>
        <h2>Reports &amp; Analytics</h2>
        <p>Please <a routerLink="/login" class="link">sign in</a> to view reports.</p>
      </div>

      <!-- Non-admin authenticated -->
      <div *ngIf="auth.isAuthenticated() && auth.role() !== 'Admin'" class="empty-state-page access-denied">
        <span class="es-icon">🔒</span>
        <h2>Admin Access Required</h2>
        <p>Reports &amp; Analytics are only available to administrators.<br>Contact your workspace admin to upgrade your role.</p>
      </div>

      <!-- Admin dashboard -->
      <div *ngIf="auth.isAuthenticated() && auth.role() === 'Admin'" class="dashboard">

        <!-- Page header -->
        <div class="page-header">
          <div class="page-header-left">
            <h1 class="page-title">📊 Reports &amp; Analytics</h1>
            <p class="page-sub">Overview of your Trello workspace activity</p>
          </div>
          <div class="page-header-right">
            <span *ngIf="isDemo() && !errorMsg()" class="demo-badge">📋 Demo data — add boards &amp; cards to see real stats</span>
            <button class="btn-refresh" (click)="loadReport()" [disabled]="loading()">
              <span *ngIf="loading()">⏳ Loading…</span>
              <span *ngIf="!loading()">🔄 Refresh</span>
            </button>
          </div>
        </div>

        <!-- Error banner (non-fatal) -->
        <div *ngIf="errorMsg()" class="error-banner">
          ⚠️ {{ errorMsg() }} — Showing demo data below.
        </div>

        <!-- KPI cards -->
        <div class="kpi-grid" *ngIf="data()">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">💼</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.totalWorkspaces }}</div>
              <div class="kpi-label">Workspaces</div>
            </div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">📋</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.totalBoards }}</div>
              <div class="kpi-label">Boards</div>
            </div>
          </div>
          <div class="kpi-card kpi-teal">
            <div class="kpi-icon">📑</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.totalLists }}</div>
              <div class="kpi-label">Lists</div>
            </div>
          </div>
          <div class="kpi-card kpi-orange">
            <div class="kpi-icon">🗂</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.totalCards }}</div>
              <div class="kpi-label">Cards</div>
            </div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">✅</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.completedTasks }}</div>
              <div class="kpi-label">Completed</div>
            </div>
          </div>
          <div class="kpi-card kpi-red">
            <div class="kpi-icon">⏰</div>
            <div class="kpi-body">
              <div class="kpi-value">{{ data()!.overdueTasks }}</div>
              <div class="kpi-label">Overdue</div>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-grid" *ngIf="data()">

          <!-- Status Distribution -->
          <div class="chart-card">
            <h3 class="chart-title">Task Status</h3>
            <div class="donut-wrap">
              <svg viewBox="0 0 120 120" class="donut-svg">
                <ng-container *ngFor="let seg of statusDonut(); let i = index">
                  <circle
                    class="donut-seg"
                    cx="60" cy="60" r="46"
                    [attr.stroke]="seg.color"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    stroke-width="20"
                    fill="none"
                  />
                </ng-container>
                <text x="60" y="56" text-anchor="middle" class="donut-center-val">{{ data()!.totalCards }}</text>
                <text x="60" y="70" text-anchor="middle" class="donut-center-lbl">Total</text>
              </svg>
            </div>
            <div class="legend">
              <div class="legend-item" *ngFor="let seg of statusDonut()">
                <span class="legend-dot" [style.background]="seg.color"></span>
                <span class="legend-label">{{ seg.label }}</span>
                <span class="legend-val">{{ seg.value }}</span>
              </div>
            </div>
          </div>

          <!-- Priority Distribution -->
          <div class="chart-card">
            <h3 class="chart-title">Priority Breakdown</h3>
            <div class="bars-list">
              <div class="bar-row" *ngFor="let seg of data()!.priorityBreakdown">
                <div class="bar-meta">
                  <span class="bar-label">{{ seg.label }}</span>
                  <span class="bar-count">{{ seg.value }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill"
                    [style.width.%]="pct(seg, data()!.priorityBreakdown)"
                    [style.background]="priorityColor(seg.label)">
                  </div>
                </div>
              </div>
              <div *ngIf="!data()!.priorityBreakdown.length" class="no-data-row">No priority data</div>
            </div>
            <!-- Summary row -->
            <div class="priority-summary">
              <div class="ps-item ps-high">
                <span class="ps-num">{{ data()!.highPriorityTasks }}</span>
                <span class="ps-lbl">High</span>
              </div>
              <div class="ps-item ps-med">
                <span class="ps-num">{{ data()!.mediumPriorityTasks }}</span>
                <span class="ps-lbl">Medium</span>
              </div>
              <div class="ps-item ps-low">
                <span class="ps-num">{{ data()!.lowPriorityTasks }}</span>
                <span class="ps-lbl">Low</span>
              </div>
            </div>
          </div>

          <!-- Assignee Breakdown -->
          <div class="chart-card">
            <h3 class="chart-title">Assigned Tasks</h3>
            <div class="bars-list">
              <div class="bar-row" *ngFor="let seg of data()!.assigneeBreakdown">
                <div class="bar-meta">
                  <span class="bar-label">{{ shortEmail(seg.label) }}</span>
                  <span class="bar-count">{{ seg.value }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill assignee-fill"
                    [style.width.%]="pct(seg, data()!.assigneeBreakdown)">
                  </div>
                </div>
              </div>
              <div *ngIf="!data()!.assigneeBreakdown.length" class="no-data-row">
                No assigned cards yet
              </div>
            </div>
          </div>
        </div>

        <!-- Progress overview -->
        <div class="progress-card" *ngIf="data()">
          <h3 class="chart-title">Overall Progress</h3>
          <div class="progress-bar-outer">
            <div class="progress-segment seg-done"
              [style.width.%]="progressPct(data()!.completedTasks)">
            </div>
            <div class="progress-segment seg-inprog"
              [style.width.%]="progressPct(data()!.inProgressTasks)">
            </div>
            <div class="progress-segment seg-todo"
              [style.width.%]="progressPct(data()!.toDoTasks)">
            </div>
          </div>
          <div class="progress-legend">
            <span class="pl-item"><span class="pl-dot" style="background:#36b37e"></span>Done ({{ data()!.completedTasks }})</span>
            <span class="pl-item"><span class="pl-dot" style="background:#0052cc"></span>In Progress ({{ data()!.inProgressTasks }})</span>
            <span class="pl-item"><span class="pl-dot" style="background:#dfe1e6"></span>To Do ({{ data()!.toDoTasks }})</span>
          </div>
          <div class="stats-row">
            <div class="stat-pill">
              <span class="stat-num">{{ data()!.averageCardsPerList }}</span>
              <span class="stat-lbl">Avg cards / list</span>
            </div>
            <div class="stat-pill" *ngIf="data()!.totalCards > 0">
              <span class="stat-num">{{ completionRate() }}%</span>
              <span class="stat-lbl">Completion rate</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  `,
  styles: [`
    .reports-root {
      min-height: calc(100vh - 48px);
      background: #f4f5f7;
    }

    /* ── Empty states ── */
    .empty-state-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 48px);
      text-align: center;
      color: #42526e;
      padding: 40px;
    }
    .es-icon { font-size: 3.5rem; margin-bottom: 16px; }
    .empty-state-page h2 { margin: 0 0 8px; font-size: 1.5rem; color: #172b4d; }
    .empty-state-page p { font-size: 0.95rem; }
    .access-denied .es-icon { font-size: 4rem; }
    .link { color: #0052cc; font-weight: 600; text-decoration: none; }
    .link:hover { text-decoration: underline; }

    /* ── Dashboard layout ── */
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 24px 48px;
    }

    /* ── Page header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172b4d;
      margin: 0 0 4px;
    }
    .page-sub {
      font-size: 0.875rem;
      color: #5e6c84;
      margin: 0;
    }
    .page-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .demo-badge {
      font-size: 0.75rem;
      background: #fff0b3;
      color: #7a6000;
      border: 1px solid #ffe57f;
      border-radius: 4px;
      padding: 4px 10px;
      font-weight: 600;
    }
    .btn-refresh {
      padding: 8px 18px;
      background: #0052cc;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-refresh:hover:not(:disabled) { background: #0747a6; }
    .btn-refresh:disabled { opacity: 0.6; cursor: default; }

    /* ── Error banner ── */
    .error-banner {
      background: #ffebe6;
      border: 1px solid #ff8f73;
      border-radius: 6px;
      padding: 10px 16px;
      font-size: 0.875rem;
      color: #bf2600;
      margin-bottom: 20px;
    }

    /* ── KPI grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #fff;
      border-radius: 8px;
      padding: 18px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(9,30,66,0.1);
      border-left: 4px solid transparent;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(9,30,66,0.15);
    }
    .kpi-icon { font-size: 1.6rem; }
    .kpi-value { font-size: 1.8rem; font-weight: 800; color: #172b4d; line-height: 1; }
    .kpi-label { font-size: 0.75rem; color: #5e6c84; font-weight: 600; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-blue   { border-left-color: #0052cc; }
    .kpi-purple { border-left-color: #6554c0; }
    .kpi-teal   { border-left-color: #00b8d9; }
    .kpi-orange { border-left-color: #ff8b00; }
    .kpi-green  { border-left-color: #36b37e; }
    .kpi-red    { border-left-color: #de350b; }

    /* ── Charts grid ── */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(9,30,66,0.1);
    }
    .chart-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #172b4d;
      margin: 0 0 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f4f5f7;
    }

    /* ── Donut ── */
    .donut-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    .donut-svg {
      width: 130px;
      height: 130px;
    }
    .donut-seg {
      transition: stroke-dashoffset 0.5s ease;
    }
    .donut-center-val {
      font-size: 18px;
      font-weight: 800;
      fill: #172b4d;
    }
    .donut-center-lbl {
      font-size: 9px;
      fill: #5e6c84;
    }

    /* ── Legend ── */
    .legend {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label { flex: 1; color: #172b4d; font-weight: 500; }
    .legend-val { font-weight: 700; color: #42526e; }

    /* ── Bars ── */
    .bars-list { display: flex; flex-direction: column; gap: 12px; }
    .bar-row {}
    .bar-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .bar-label { font-size: 0.82rem; color: #172b4d; font-weight: 500; }
    .bar-count { font-size: 0.82rem; color: #5e6c84; font-weight: 700; }
    .bar-track {
      height: 8px;
      background: #f4f5f7;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.6s ease;
      min-width: 4px;
    }
    .assignee-fill { background: linear-gradient(90deg, #0052cc, #6554c0); }
    .no-data-row {
      font-size: 0.82rem;
      color: #8993a4;
      text-align: center;
      padding: 12px 0;
    }

    /* ── Priority summary ── */
    .priority-summary {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #f4f5f7;
    }
    .ps-item {
      flex: 1;
      text-align: center;
      padding: 8px;
      border-radius: 6px;
    }
    .ps-high { background: #ffebe6; }
    .ps-med  { background: #fff0b3; }
    .ps-low  { background: #e3fcef; }
    .ps-num { display: block; font-size: 1.25rem; font-weight: 800; color: #172b4d; }
    .ps-lbl { font-size: 0.7rem; font-weight: 700; color: #5e6c84; text-transform: uppercase; }

    /* ── Progress card ── */
    .progress-card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(9,30,66,0.1);
    }
    .progress-bar-outer {
      display: flex;
      height: 16px;
      border-radius: 999px;
      overflow: hidden;
      background: #f4f5f7;
      margin: 8px 0 12px;
    }
    .progress-segment {
      height: 100%;
      transition: width 0.6s ease;
    }
    .seg-done   { background: #36b37e; }
    .seg-inprog { background: #0052cc; }
    .seg-todo   { background: #dfe1e6; }
    .progress-legend {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .pl-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #42526e;
      font-weight: 500;
    }
    .pl-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .stats-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f4f5f7;
      border-radius: 8px;
      padding: 10px 20px;
      min-width: 120px;
    }
    .stat-num { font-size: 1.5rem; font-weight: 800; color: #172b4d; }
    .stat-lbl { font-size: 0.72rem; color: #5e6c84; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }
  `]
})
export class ReportsComponent implements OnInit {
  report   = signal<DashboardReport | null>(null);
  loading  = signal(false);
  errorMsg = signal('');
  isDemo   = signal(false);

  data = computed<DashboardReport | null>(() => this.report());

  // Donut chart segments for status
  readonly STATUS_COLORS: Record<string, string> = {
    'ToDo':       '#dfe1e6',
    'InProgress': '#0052cc',
    'Done':       '#36b37e',
  };
  readonly CIRCUMFERENCE = 2 * Math.PI * 46; // r=46

  statusDonut = computed(() => {
    const breakdown = this.report()?.statusBreakdown ?? [];
    const total = breakdown.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;
    return breakdown.map((seg, i) => {
      const frac = seg.value / total;
      const dash = `${frac * this.CIRCUMFERENCE} ${(1 - frac) * this.CIRCUMFERENCE}`;
      const result = {
        label: seg.label,
        value: seg.value,
        color: this.STATUS_COLORS[seg.label] ?? '#6554c0',
        dash,
        offset: this.CIRCUMFERENCE - offset,
      };
      offset += frac * this.CIRCUMFERENCE;
      return result;
    });
  });

  completionRate = computed(() => {
    const d = this.report();
    if (!d || d.totalCards === 0) return 0;
    return Math.round((d.completedTasks / d.totalCards) * 100);
  });

  constructor(public auth: AuthService, private reportService: ReportService) {}

  ngOnInit() {
    if (this.auth.isAuthenticated() && this.auth.role() === 'Admin') {
      this.loadReport();
    }
  }

  async loadReport() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const r = await this.reportService.getDashboardReport();
      // If no cards are present, or counts are 0, fall back to demo data
      if (r.totalCards === 0) {
        this.report.set(DEMO_REPORT);
        this.isDemo.set(true);
      } else {
        this.report.set(r);
        this.isDemo.set(false);
      }
    } catch (err: any) {
      this.errorMsg.set(err?.message ?? 'Failed to load report.');
      // Always show demo data on error so the page isn't blank
      this.report.set(DEMO_REPORT);
      this.isDemo.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  pct(seg: ChartSegment, all: ChartSegment[]): number {
    const max = Math.max(...all.map(x => x.value), 1);
    return Math.round((seg.value / max) * 100);
  }

  progressPct(val: number): number {
    const total = this.report()?.totalCards || 1;
    return Math.round((val / total) * 100);
  }

  priorityColor(label: string): string {
    const map: Record<string, string> = {
      High: '#de350b',
      Medium: '#ff8b00',
      Low: '#36b37e',
      Unspecified: '#8993a4',
    };
    return map[label] ?? '#6554c0';
  }

  shortEmail(email: string): string {
    if (!email) return 'Unknown';
    const at = email.indexOf('@');
    return at > 0 ? email.substring(0, at) : email;
  }
}
