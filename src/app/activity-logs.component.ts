import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogItem } from './activity-log.types';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🕒 System Activity Logs</h1>
          <p class="page-subtitle">Track audit trails, user actions, and modifications across all project workspaces.</p>
        </div>
        <div>
          <button class="btn btn-primary btn-sm" (click)="loadLogs()">🔄 Refresh Logs</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Activity History Audit Trail</div>
        <div class="card-body" style="padding: 0;">
          <div *ngIf="!auth.isAuthenticated() || auth.role() !== 'Admin'" class="empty-state access-denied">
            <span class="empty-state-icon">🔒</span>
            <h3>Access Denied</h3>
            <p>These logs are only available for administrators.</p>
          </div>

          <div *ngIf="auth.isAuthenticated() && auth.role() === 'Admin'">
            <div *ngIf="logs().length === 0" class="empty-state">
            <span class="empty-state-icon">🕒</span>
            <h3>No logs recorded</h3>
            <p>Activity logs will appear here as users perform actions in the system.</p>
          </div>

          <div class="activity-timeline" *ngIf="logs().length > 0">
            <div *ngFor="let log of logs()" class="timeline-item">
              <div class="timeline-icon-wrapper">
                <span class="timeline-icon" 
                      [class.bg-create]="log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add') || log.action.toLowerCase().includes('invite')"
                      [class.bg-delete]="log.action.toLowerCase().includes('delete') || log.action.toLowerCase().includes('remove')"
                      [class.bg-update]="log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('reorder')">
                  {{ getActionEmoji(log.action) }}
                </span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="action-desc">
                    <strong>{{ log.action }}</strong> on {{ log.entityType }}
                  </span>
                  <span class="log-time">{{ log.createdAt | date:'medium' }}</span>
                </div>
                <div class="timeline-details font-xs">
                  <span>👤 User GUID: <code>{{ log.userId }}</code></span>
                  <span style="margin: 0 8px;">•</span>
                  <span>🔑 Entity GUID: <code>{{ log.entityId }}</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied { background: #fafbfc; border-radius: 0 0 6px 6px; }
    .activity-timeline {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
    }
    .activity-timeline::before {
      content: '';
      position: absolute;
      left: 39px;
      top: 24px;
      bottom: 24px;
      width: 2px;
      background: var(--border-light);
    }
    .timeline-item {
      display: flex;
      gap: 16px;
      position: relative;
      z-index: 1;
    }
    .timeline-icon-wrapper {
      flex-shrink: 0;
    }
    .timeline-icon {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--bg-hover);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem;
      box-shadow: 0 0 0 4px white;
    }
    .timeline-icon.bg-create { background: #e3fcef; color: #006644; }
    .timeline-icon.bg-delete { background: #ffebe6; color: #bf2600; }
    .timeline-icon.bg-update { background: #e6f0ff; color: #0047b3; }
    
    .timeline-content {
      flex: 1;
      background: var(--bg-primary);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      border: 1px solid var(--border-light);
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .action-desc {
      font-size: 0.92rem;
      color: var(--text-primary);
    }
    .log-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .timeline-details {
      color: var(--text-secondary);
      font-family: monospace;
    }
    .timeline-details code {
      background: rgba(0,0,0,0.05);
      padding: 2px 4px;
      border-radius: var(--radius-sm);
    }
  `]
})
export class ActivityLogsComponent implements OnInit {
  logs = signal<ActivityLogItem[]>([]);

  constructor(public auth: AuthService, private activityLogService: ActivityLogService) { }

  ngOnInit() {
    if (this.auth.isAuthenticated() && this.auth.role() === 'Admin') {
      this.loadLogs();
    }
  }

  async loadLogs() {
    const items = await this.activityLogService.getAllLogs();
    this.logs.set(items.sort((a: ActivityLogItem, b: ActivityLogItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  getActionEmoji(action: string): string {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) return '➕';
    if (act.includes('delete') || act.includes('remove')) return '🗑';
    if (act.includes('update') || act.includes('reorder')) return '✏';
    if (act.includes('invite')) return '📩';
    return '🔔';
  }
}

