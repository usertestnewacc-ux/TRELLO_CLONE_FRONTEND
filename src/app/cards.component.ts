import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CardService } from './card.service';
import { CardItem } from './card.types';

@Component({
  selector: 'cards-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">🗂 My Assigned Cards</h1>
          <p class="page-subtitle">All task cards currently assigned to you across all boards and workspaces.</p>
        </div>
        <div class="header-actions">
          <div class="filter-group">
            <label class="form-label" style="margin:0; white-space:nowrap;">Filter by Status:</label>
            <select class="form-control filter-select" [(ngModel)]="statusFilter" (change)="applyFilter()">
              <option value="ALL">All Statuses</option>
              <option value="ToDo">To Do</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label" style="margin:0; white-space:nowrap;">Priority:</label>
            <select class="form-control filter-select" [(ngModel)]="priorityFilter" (change)="applyFilter()">
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="message() && !message().includes('successfully')">
        <span>⚠</span> {{ message() }}
      </div>
      <div class="alert alert-success" *ngIf="message() && message().includes('successfully')">
        <span>✔</span> {{ message() }}
      </div>

      <!-- Stats bar -->
      <div class="stats-bar" *ngIf="allMyCards().length > 0">
        <div class="stat-chip stat-all">
          <span class="stat-number">{{ allMyCards().length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-chip stat-todo">
          <span class="stat-number">{{ countByStatus('ToDo') }}</span>
          <span class="stat-label">To Do</span>
        </div>
        <div class="stat-chip stat-inprogress">
          <span class="stat-number">{{ countByStatus('InProgress') }}</span>
          <span class="stat-label">In Progress</span>
        </div>
        <div class="stat-chip stat-done">
          <span class="stat-number">{{ countByStatus('Done') }}</span>
          <span class="stat-label">Done</span>
        </div>
        <div class="stat-chip stat-high" *ngIf="countByPriority('High') > 0">
          <span class="stat-number">{{ countByPriority('High') }}</span>
          <span class="stat-label">🔴 High</span>
        </div>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="spinner"></div>
        <p>Loading your assigned cards...</p>
      </div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!isLoading() && allMyCards().length === 0">
        <span class="empty-state-icon">🗂</span>
        <h3>No cards assigned to you</h3>
        <p>You don't have any task cards assigned yet. Ask your team to assign cards to you from the board view.</p>
        <button class="btn btn-primary btn-sm" style="margin-top: 12px;" (click)="router.navigate(['/boards'])">
          Go to Boards
        </button>
      </div>

      <!-- Filter empty state -->
      <div class="card empty-state" *ngIf="!isLoading() && allMyCards().length > 0 && filteredCards().length === 0">
        <span class="empty-state-icon">🔍</span>
        <h3>No cards match your filter</h3>
        <p>Try changing the status or priority filter above.</p>
      </div>

      <!-- Cards Grid -->
      <div class="cards-grid" *ngIf="!isLoading() && filteredCards().length > 0">
        <div *ngFor="let card of filteredCards()" class="task-card" [class.priority-high]="card.priority === 'High'" [class.priority-medium]="card.priority === 'Medium'" [class.priority-low]="card.priority === 'Low'">
          <div class="task-card-header">
            <div class="task-badges">
              <span class="badge" [class.badge-red]="card.priority === 'High'" [class.badge-yellow]="card.priority === 'Medium'" [class.badge-blue]="card.priority === 'Low' || !card.priority">
                {{ card.priority || 'Medium' }}
              </span>
              <span class="badge badge-green" *ngIf="card.status === 'Done'">✓ Done</span>
              <span class="badge badge-yellow" *ngIf="card.status === 'InProgress'">⏳ In Progress</span>
              <span class="badge badge-gray" *ngIf="card.status === 'ToDo' || !card.status">📌 To Do</span>
            </div>
            <div class="task-due" *ngIf="card.dueDate">
              <span [class.overdue]="isOverdue(card.dueDate)">📅 {{ card.dueDate | slice:0:10 }}</span>
            </div>
          </div>

          <h3 class="task-title">{{ card.title }}</h3>
          <p class="task-desc" *ngIf="card.description">{{ card.description }}</p>

          <div class="task-card-footer">
            <div class="task-status-select">
              <select class="form-control inline-status-select" [(ngModel)]="card.status" (change)="quickUpdateStatus(card)">
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="router.navigate(['/boards'], { queryParams: { boardId: 'find' } })">
              Open Board
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-select {
      width: 150px;
      height: 36px;
      padding: 4px 10px;
    }

    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .stat-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      border-radius: 8px;
      min-width: 80px;
    }
    .stat-all { background: #f4f5f7; }
    .stat-todo { background: #e3f0ff; }
    .stat-inprogress { background: #fff8e1; }
    .stat-done { background: #e3fcef; }
    .stat-high { background: #ffebe6; }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172b4d;
    }
    .stat-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
    }

    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .task-card {
      background: #fff;
      border: 1px solid #dfe1e6;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: box-shadow 0.15s, transform 0.15s;
      border-left: 4px solid #dfe1e6;
    }
    .task-card:hover {
      box-shadow: 0 4px 12px rgba(9,30,66,0.15);
      transform: translateY(-1px);
    }
    .task-card.priority-high { border-left-color: #de350b; }
    .task-card.priority-medium { border-left-color: #ffab00; }
    .task-card.priority-low { border-left-color: #36b37e; }

    .task-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .task-badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .task-due {
      font-size: 0.75rem;
      color: #5e6c84;
      white-space: nowrap;
    }
    .task-due .overdue {
      color: #de350b;
      font-weight: 600;
    }
    .task-title {
      font-size: 1rem;
      font-weight: 700;
      color: #172b4d;
      margin: 0;
      line-height: 1.3;
    }
    .task-desc {
      font-size: 0.85rem;
      color: #5e6c84;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .task-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      border-top: 1px solid #f4f5f7;
      padding-top: 10px;
      margin-top: 4px;
    }
    .inline-status-select {
      height: 30px;
      padding: 2px 8px;
      font-size: 0.8rem;
      border-radius: 4px;
      width: auto;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      color: #5e6c84;
      gap: 16px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #dfe1e6;
      border-top-color: #0052cc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CardsComponent implements OnInit {
  private cardService = inject(CardService);
  public auth = inject(AuthService);
  public router = inject(Router);

  allMyCards = signal<CardItem[]>([]);
  filteredCards = signal<CardItem[]>([]);
  users = signal<Array<{ id: string; email: string }>>([]);
  message = signal('');
  isLoading = signal(false);

  statusFilter = 'ALL';
  priorityFilter = 'ALL';

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.loadMyCards();
    }
  }

  async loadMyCards() {
    this.isLoading.set(true);
    this.message.set('');
    try {
      const currentUserId = this.auth.userId();
      if (!currentUserId) {
        this.message.set('Unable to determine logged-in user.');
        return;
      }
      const allCards = await this.cardService.getAllCards();
      const myCards = allCards.filter(c => c.assignedUserId === currentUserId);
      this.allMyCards.set(myCards);
      this.filteredCards.set(myCards);
    } catch (error) {
      this.message.set('Failed to load assigned cards. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilter() {
    let result = this.allMyCards();
    if (this.statusFilter !== 'ALL') {
      result = result.filter(c => c.status === this.statusFilter);
    }
    if (this.priorityFilter !== 'ALL') {
      result = result.filter(c => c.priority === this.priorityFilter);
    }
    this.filteredCards.set(result);
  }

  countByStatus(status: string): number {
    return this.allMyCards().filter(c => c.status === status).length;
  }

  countByPriority(priority: string): number {
    return this.allMyCards().filter(c => c.priority === priority).length;
  }

  isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  async quickUpdateStatus(card: CardItem) {
    try {
      await this.cardService.updateCard(card.id, {
        title: card.title,
        description: card.description,
        priority: card.priority,
        dueDate: card.dueDate || undefined,
        assignedUserId: card.assignedUserId || undefined,
        status: card.status,
        position: card.position
      });
      this.message.set('Status updated successfully.');
      setTimeout(() => this.message.set(''), 2000);
      this.applyFilter();
    } catch {
      this.message.set('Failed to update card status.');
    }
  }
}
