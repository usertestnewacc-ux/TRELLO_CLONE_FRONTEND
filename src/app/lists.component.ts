import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { ListService } from './list.service';
import { ListItem } from './list.types';

@Component({
  selector: 'lists-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Board Lists Management</h1>
          <p class="page-subtitle">Load a board to manage its task columns, create new lists, and reorder them.</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="message() && !message().includes('successfully')">
        <span>⚠</span> {{ message() }}
      </div>
      <div class="alert alert-success" *ngIf="message() && message().includes('successfully')">
        <span>✔</span> {{ message() }}
      </div>

      <div class="grid-2" style="align-items: start; gap: 24px;">
        <!-- Load board list & Create List -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div class="card">
            <div class="card-header">Select Board</div>
            <div class="card-body">
              <form (ngSubmit)="loadLists()" class="lists-form">
                <div class="form-group">
                  <label class="form-label" for="boardId">Enter Board GUID</label>
                  <input id="boardId" class="form-control" type="text" [(ngModel)]="boardId" name="boardId" placeholder="e.g. 00000000-0000-0000-0000-000000000000" required />
                </div>
                <button class="btn btn-primary" type="submit">Load Board Lists</button>
              </form>
            </div>
          </div>

          <div class="card" *ngIf="boardId">
            <div class="card-header">Create New Column List</div>
            <div class="card-body">
              <form (ngSubmit)="createList()" class="lists-form">
                <div class="form-group">
                  <label class="form-label" for="newTitle">List Title</label>
                  <input id="newTitle" class="form-control" type="text" [(ngModel)]="newTitle" name="newTitle" placeholder="e.g. In Review" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="newPosition">Position (Index)</label>
                  <input id="newPosition" class="form-control" type="number" [(ngModel)]="newPosition" name="newPosition" min="0" required />
                </div>
                <button class="btn btn-success" type="submit">Create List</button>
              </form>
            </div>
          </div>
        </div>

        <!-- Lists ordering and rows -->
        <div class="card" *ngIf="lists().length > 0">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Task Columns Order</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-ghost btn-sm" (click)="moveAllUp()" title="Decrease all positions">Move All Up</button>
              <button class="btn btn-ghost btn-sm" (click)="moveAllDown()" title="Increase all positions">Move All Down</button>
              <button class="btn btn-primary btn-sm" (click)="saveOrder()">Save Order</button>
            </div>
          </div>
          <div class="card-body">
            <div class="lists-list-wrapper">
              <div *ngFor="let item of lists(); let i = index" class="list-row-item">
                <div class="list-row-info">
                  <span class="badge badge-blue">Pos: {{ item.position }}</span>
                  <span class="list-row-title">{{ item.title }}</span>
                  <span class="list-row-id">ID: {{ item.id }}</span>
                </div>
                <div class="list-row-actions">
                  <button class="btn btn-secondary btn-sm" (click)="moveUp(i)" [disabled]="i === 0">▲</button>
                  <button class="btn btn-secondary btn-sm" (click)="moveDown(i)" [disabled]="i === lists().length - 1">▼</button>
                  <button class="btn btn-danger btn-sm btn-icon-only" (click)="deleteList(item.id)">🗑</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lists-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .lists-list-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .list-row-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      gap: 10px;
    }
    .list-row-info {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .list-row-title {
      font-weight: 700;
      color: var(--text-primary);
    }
    .list-row-id {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: monospace;
      white-space: nowrap;
    }
    .list-row-actions {
      display: flex;
      gap: 6px;
    }
  `]
})
export class ListsComponent {
  boardId = '';
  newTitle = '';
  newPosition = 0;
  lists = signal<ListItem[]>([]);
  message = signal('');

  constructor(public auth: AuthService, private listService: ListService) {}

  async loadLists() {
    if (!this.boardId.trim()) {
      this.message.set('Board ID is required.');
      return;
    }

    this.message.set('');
    try {
      const loaded = await this.listService.getLists(this.boardId.trim());
      this.lists.set(loaded.sort((a, b) => a.position - b.position));
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async createList() {
    if (!this.boardId.trim() || !this.newTitle.trim()) {
      this.message.set('Board ID and title are required.');
      return;
    }

    this.message.set('');
    try {
      const list = await this.listService.createList({
        boardId: this.boardId.trim(),
        title: this.newTitle.trim(),
        position: this.newPosition
      });
      this.lists.update((current) => [...current, list].sort((a, b) => a.position - b.position));
      this.newTitle = '';
      this.newPosition = this.lists().length;
      this.message.set('List created successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async deleteList(listId: string) {
    if (!confirm('Delete this list?')) {
      return;
    }

    this.message.set('');
    try {
      await this.listService.deleteList(listId);
      this.lists.update((current) => current.filter((item) => item.id !== listId));
      this.message.set('List deleted successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  moveUp(index: number) {
    if (index <= 0) {
      return;
    }

    this.lists.update((items) => {
      const next = [...items];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((item, pos) => ({ ...item, position: pos }));
    });
  }

  moveDown(index: number) {
    this.lists.update((items) => {
      if (index >= items.length - 1) {
        return items;
      }
      const next = [...items];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next.map((item, pos) => ({ ...item, position: pos }));
    });
  }

  moveAllUp() {
    this.lists.update((items) => items.map((item, idx) => ({ ...item, position: Math.max(0, idx - 1) })));
  }

  moveAllDown() {
    this.lists.update((items) => items.map((item, idx) => ({ ...item, position: idx + 1 })));
  }

  async saveOrder() {
    if (!this.boardId.trim()) {
      this.message.set('Board ID is required to save order.');
      return;
    }

    this.message.set('');
    try {
      const reordered = await this.listService.reorderLists({
        boardId: this.boardId.trim(),
        items: this.lists().map((item) => ({ listId: item.id, position: item.position }))
      });
      this.lists.set(reordered.sort((a, b) => a.position - b.position));
      this.message.set('List order saved successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }
}

