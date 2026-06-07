import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { WorkspaceService } from './workspace.service';
import { BoardService } from './board.service';
import { CardService } from './card.service';
import { Workspace } from './workspace.types';
import { Board } from './board.types';
import { CardItem } from './card.types';

interface RecentBoard {
  id: string;
  name: string;
  workspaceName: string;
  viewedAt: number;
}

@Component({
  selector: 'dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="home-root animate-in">
      <!-- Left Sidebar Navigation -->
      <aside class="home-sidebar">
        <ul class="sidebar-menu">
          <li class="menu-item active">
            <a routerLink="/dashboard" class="menu-link">
              <span class="menu-icon">⚡</span>
              <span class="menu-text">Home</span>
            </a>
          </li>
          <li class="menu-item">
            <a routerLink="/boards" class="menu-link">
              <span class="menu-icon">📋</span>
              <span class="menu-text">Boards</span>
            </a>
          </li>
          <li class="menu-item">
            <a routerLink="/cards" class="menu-link">
              <span class="menu-icon">🗂</span>
              <span class="menu-text">My Cards</span>
            </a>
          </li>
        </ul>

        <div class="sidebar-divider"></div>

        <div class="workspaces-heading">
          <span>Workspaces</span>
          <button class="btn-add-ws" (click)="openCreateWorkspaceModal()" title="Create workspace">+</button>
        </div>

        <div class="workspaces-list" *ngIf="workspaces().length > 0">
          <div *ngFor="let ws of workspaces()" class="sidebar-ws-item">
            <div class="ws-toggle-header" (click)="toggleWorkspace(ws.id)">
              <span class="ws-arrow" [class.expanded]="isWorkspaceExpanded(ws.id)">▶</span>
              <div class="ws-avatar-small">{{ ws.name.substring(0, 1).toUpperCase() }}</div>
              <span class="ws-name">{{ ws.name }}</span>
            </div>
            <ul class="ws-sub-menu" *ngIf="isWorkspaceExpanded(ws.id)">
              <li>
                <a [routerLink]="['/workspaces']" [queryParams]="{workspaceId: ws.id, tab: 'boards'}" class="sub-menu-link">
                  <span>📋</span> Boards
                </a>
              </li>
              <li>
                <a [routerLink]="['/workspaces']" [queryParams]="{workspaceId: ws.id, tab: 'members'}" class="sub-menu-link">
                  <span>👥</span> Members
                </a>
              </li>
              <li>
                <a [routerLink]="['/workspaces']" [queryParams]="{workspaceId: ws.id, tab: 'settings'}" class="sub-menu-link">
                  <span>⚙</span> Settings
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="sidebar-create-ws-btn">
          <button class="btn btn-secondary btn-full" (click)="openCreateWorkspaceModal()">
            ➕ Create Workspace
          </button>
        </div>
      </aside>

      <!-- Center Main Content -->
      <main class="home-main">
        <!-- Organize Anything Promo Card -->
        <div class="organize-promo" *ngIf="showPromo()">
          <div class="promo-illustration">
            <div class="mock-board">
              <div class="mock-header"></div>
              <div class="mock-body">
                <div class="mock-col">
                  <div class="mock-card"></div>
                  <div class="mock-card"></div>
                </div>
                <div class="mock-col">
                  <div class="mock-card active-card"></div>
                  <div class="mock-card"></div>
                </div>
                <div class="mock-col plant-col">
                  <div class="mock-card plant-card">🪴</div>
                </div>
              </div>
            </div>
          </div>
          <div class="promo-content">
            <h2>Organize anything</h2>
            <p>Put everything in one place and start moving things forward with your first Trello board!</p>
            <button class="btn btn-primary" (click)="openCreateBoardModal()">Create a Workspace board</button>
            <button class="btn-dismiss" (click)="dismissPromo()">Got it! Dismiss this.</button>
          </div>
        </div>

        <!-- Activity Stats Section -->
        <div class="activity-stats-section" *ngIf="myCards().length > 0 || boards().length > 0">
          <h2 class="section-title">Your Activity Overview</h2>
          <div class="stats-grid">
            <div class="stat-block stat-blue">
              <div class="stat-icon">📋</div>
              <div class="stat-data">
                <span class="stat-num">{{ boards().length }}</span>
                <span class="stat-lbl">Boards</span>
              </div>
            </div>
            <div class="stat-block stat-orange">
              <div class="stat-icon">⏳</div>
              <div class="stat-data">
                <span class="stat-num">{{ countMyCardsByStatus('InProgress') }}</span>
                <span class="stat-lbl">In Progress</span>
              </div>
            </div>
            <div class="stat-block stat-green">
              <div class="stat-icon">✅</div>
              <div class="stat-data">
                <span class="stat-num">{{ countMyCardsByStatus('Done') }}</span>
                <span class="stat-lbl">Completed</span>
              </div>
            </div>
            <div class="stat-block stat-red">
              <div class="stat-icon">🔴</div>
              <div class="stat-data">
                <span class="stat-num">{{ countMyCardsByPriority('High') }}</span>
                <span class="stat-lbl">High Priority</span>
              </div>
            </div>
            <div class="stat-block stat-purple">
              <div class="stat-icon">📌</div>
              <div class="stat-data">
                <span class="stat-num">{{ myCards().length }}</span>
                <span class="stat-lbl">Assigned Cards</span>
              </div>
            </div>
            <div class="stat-block stat-gray">
              <div class="stat-icon">💼</div>
              <div class="stat-data">
                <span class="stat-num">{{ workspaces().length }}</span>
                <span class="stat-lbl">Workspaces</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Workspaces and Boards Grid -->
        <div class="workspaces-section-grid">
          <div class="section-title-row">
            <h2>Your Workspaces and Boards</h2>
            <button class="btn btn-secondary btn-sm" (click)="openCreateWorkspaceModal()">
              ➕ Create Workspace
            </button>
          </div>

          <div *ngIf="workspaces().length === 0" class="empty-workspace-state">
            <p>You don't have any workspaces yet. Create a workspace to build project boards.</p>
            <button class="btn btn-primary btn-sm" (click)="openCreateWorkspaceModal()">Create a Workspace</button>
          </div>

          <div *ngFor="let ws of workspaces()" class="workspace-boards-block">
            <div class="ws-block-header">
              <div class="ws-block-avatar">{{ ws.name.substring(0, 1).toUpperCase() }}</div>
              <div class="ws-block-info">
                <h3>{{ ws.name }}</h3>
                <p>{{ ws.description || 'No description provided.' }}</p>
              </div>
              <button class="btn btn-secondary btn-sm" [routerLink]="['/workspaces']" [queryParams]="{workspaceId: ws.id}">Workspace settings</button>
            </div>

            <div class="boards-grid-home">
              <!-- Boards list -->
              <div *ngFor="let board of getWorkspaceBoards(ws.id)" 
                   class="board-card-home" 
                   [style.background]="getBoardBg(board.id)"
                   (click)="goToBoard(board.id)">
                <h3>{{ board.name }}</h3>
                <span class="board-card-ws-name">{{ ws.name }}</span>
              </div>

              <!-- Create board button inside workspace -->
              <div class="board-card-home create-board-card" (click)="openCreateBoardModal(ws.id)">
                <span>Create new board</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar Panel -->
      <aside class="home-right-panel">
        <!-- Recently Viewed -->
        <div class="panel-section">
          <div class="panel-header">
            <span class="panel-icon">🕒</span>
            <h3>Recently viewed</h3>
          </div>
          <div class="recent-list" *ngIf="recentBoards().length > 0">
            <div *ngFor="let board of recentBoards()" 
                 class="recent-item" 
                 (click)="goToBoard(board.id)">
              <div class="recent-color" [style.background]="getBoardBg(board.id)"></div>
              <div class="recent-info">
                <h4>{{ board.name }}</h4>
                <p>{{ board.workspaceName }}</p>
              </div>
            </div>
          </div>
          <div class="recent-empty" *ngIf="recentBoards().length === 0">
            <p>No recently viewed boards</p>
          </div>
        </div>

        <!-- My Cards Summary -->
        <div class="panel-section" *ngIf="myCards().length > 0">
          <div class="panel-header">
            <span class="panel-icon">🗂</span>
            <h3>My Tasks</h3>
          </div>
          <div class="my-tasks-list">
            <div *ngFor="let card of myCards().slice(0, 5)" class="my-task-item">
              <span class="my-task-status-dot"
                [class.dot-todo]="card.status === 'ToDo'"
                [class.dot-inprogress]="card.status === 'InProgress'"
                [class.dot-done]="card.status === 'Done'"></span>
              <span class="my-task-title">{{ card.title }}</span>
            </div>
            <a routerLink="/cards" class="btn-view-all-tasks" *ngIf="myCards().length > 5">
              View all {{ myCards().length }} tasks →
            </a>
            <a routerLink="/cards" class="btn-view-all-tasks" *ngIf="myCards().length <= 5 && myCards().length > 0">
              View all tasks →
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <div class="panel-section">
          <div class="panel-header">
            <h3>Quick Actions</h3>
          </div>
          <button class="btn-create-board-link" (click)="openCreateBoardModal()">
            <span class="plus-sign">+</span> Create new board
          </button>
          <button class="btn-create-board-link" (click)="openCreateWorkspaceModal()" style="margin-top:8px;">
            <span class="plus-sign">+</span> Create workspace
          </button>
        </div>
      </aside>

      <!-- Board Creation Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal()">
        <div class="modal animate-in">
          <div class="modal-header">
            <span class="modal-title">Create New Board</span>
            <button class="btn-icon" (click)="showCreateModal.set(false)">✕</button>
          </div>
          <form (ngSubmit)="createBoardSubmit()">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="newBoardName">Board Name</label>
                <input id="newBoardName" class="form-control" type="text" [(ngModel)]="newBoardName" name="newBoardName" placeholder="e.g. Sprint Backlog" required />
              </div>
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="newBoardDescription">Description</label>
                <textarea id="newBoardDescription" class="form-control" [(ngModel)]="newBoardDescription" name="newBoardDescription" placeholder="Optional summary"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="newBoardWorkspace">Workspace</label>
                <select id="newBoardWorkspace" class="form-control" [(ngModel)]="newBoardWorkspaceId" name="newBoardWorkspaceId" required>
                  <option value="" disabled>Select a Workspace</option>
                  <option *ngFor="let ws of workspaces()" [value]="ws.id">{{ ws.name }}</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" (click)="showCreateModal.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit" [disabled]="!newBoardName.trim() || !newBoardWorkspaceId">Create Board</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Workspace Modal -->
      <div class="modal-overlay" *ngIf="showCreateWorkspaceModal()">
        <div class="modal animate-in">
          <div class="modal-header">
            <span class="modal-title">Create New Workspace</span>
            <button class="btn-icon" (click)="showCreateWorkspaceModal.set(false)">✕</button>
          </div>
          <form (ngSubmit)="createWorkspaceSubmit()">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="wsName">Workspace Name</label>
                <input id="wsName" class="form-control" type="text" [(ngModel)]="newWorkspaceName" name="newWorkspaceName" placeholder="e.g. Marketing Team" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="wsDescription">Description</label>
                <textarea id="wsDescription" class="form-control" [(ngModel)]="newWorkspaceDescription" name="newWorkspaceDescription" placeholder="What does this workspace do?"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" (click)="showCreateWorkspaceModal.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit" [disabled]="!newWorkspaceName.trim()">Create Workspace</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-root {
      display: grid;
      grid-template-columns: 240px 1fr 280px;
      min-height: calc(100vh - 48px);
      background: #ffffff;
    }
    @media (max-width: 1100px) {
      .home-root {
        grid-template-columns: 200px 1fr;
      }
      .home-right-panel {
        display: none;
      }
    }
    @media (max-width: 768px) {
      .home-root {
        grid-template-columns: 1fr;
      }
      .home-sidebar {
        display: none;
      }
    }

    /* Sidebar styles */
    .home-sidebar {
      background: #ffffff;
      padding: 16px 8px;
      border-right: 1px solid #dfe1e6;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .menu-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      color: #42526e;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      border-radius: 4px;
      transition: background 0.15s, color 0.15s;
    }
    .menu-link:hover {
      background: rgba(9, 30, 66, 0.08);
      color: #172b4d;
    }
    .menu-item.active .menu-link {
      background: #e6fcff;
      color: #008da6;
    }
    .menu-icon {
      font-size: 1.1rem;
    }
    .sidebar-divider {
      height: 1px;
      background: #dfe1e6;
      margin: 16px 0;
    }
    .workspaces-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #5e6c84;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .btn-add-ws {
      border: none;
      background: transparent;
      font-size: 1rem;
      color: #5e6c84;
      cursor: pointer;
      font-weight: 700;
    }
    .btn-add-ws:hover {
      color: #172b4d;
    }
    .sidebar-ws-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }
    .ws-toggle-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .ws-toggle-header:hover {
      background: rgba(9, 30, 66, 0.08);
    }
    .ws-arrow {
      font-size: 0.6rem;
      color: #5e6c84;
      transition: transform 0.15s;
      transform: rotate(0deg);
    }
    .ws-arrow.expanded {
      transform: rotate(90deg);
    }
    .ws-avatar-small {
      width: 20px;
      height: 20px;
      background: #0052cc;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ws-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #172b4d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ws-sub-menu {
      list-style: none;
      padding: 0 0 0 24px;
      margin: 4px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sub-menu-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      font-size: 0.8rem;
      color: #5e6c84;
      text-decoration: none;
      border-radius: 4px;
    }
    .sub-menu-link:hover {
      background: rgba(9, 30, 66, 0.08);
      color: #172b4d;
    }
    .sidebar-create-ws-btn {
      margin-top: auto;
      padding: 16px 8px 8px;
    }

    /* Main body styles */
    .home-main {
      padding: 32px 40px;
      overflow-y: auto;
    }

    /* Activity stats */
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #172b4d;
      margin: 0 0 16px 0;
    }
    .activity-stats-section {
      margin-bottom: 32px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
    }
    .stat-block {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      border: 1px solid transparent;
    }
    .stat-blue { background: #e3f0ff; border-color: #bbd6ff; }
    .stat-orange { background: #fff8e1; border-color: #ffe59b; }
    .stat-green { background: #e3fcef; border-color: #abf5d1; }
    .stat-red { background: #ffebe6; border-color: #ffbdad; }
    .stat-purple { background: #f3f0ff; border-color: #c5b9f9; }
    .stat-gray { background: #f4f5f7; border-color: #dfe1e6; }
    .stat-icon { font-size: 1.4rem; }
    .stat-num {
      font-size: 1.4rem;
      font-weight: 800;
      color: #172b4d;
      display: block;
      line-height: 1;
    }
    .stat-lbl {
      font-size: 0.72rem;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
    }

    /* Promo box styles */
    .organize-promo {
      background: #f4f5f7;
      border: 1px solid #dfe1e6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 900px) {
      .organize-promo {
        flex-direction: column;
        align-items: stretch;
      }
    }
    .promo-illustration {
      flex-shrink: 0;
      width: 220px;
      height: 120px;
      background: #e6fcff;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #00b8d9;
    }
    .mock-board {
      width: 180px;
      height: 90px;
      background: #6554c0;
      border-radius: 4px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mock-header {
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      width: 40px;
    }
    .mock-body {
      display: grid;
      grid-template-columns: 1fr 1fr 1.2fr;
      gap: 4px;
      flex: 1;
    }
    .mock-col {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      padding: 3px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .mock-card {
      height: 12px;
      background: #ffffff;
      border-radius: 2px;
      box-shadow: 0 1px 1px rgba(0,0,0,0.1);
    }
    .mock-card.active-card {
      background: #ffab00;
    }
    .plant-col {
      background: rgba(255, 255, 255, 0.3);
    }
    .plant-card {
      background: #ffffff;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      border: 1px solid #36b37e;
    }
    .promo-content h2 {
      font-size: 1.25rem;
      color: #172b4d;
      margin-top: 0;
      margin-bottom: 6px;
    }
    .promo-content p {
      font-size: 0.9rem;
      color: #5e6c84;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .btn-dismiss {
      background: transparent;
      border: none;
      color: #5e6c84;
      text-decoration: underline;
      font-size: 0.85rem;
      margin-left: 16px;
      cursor: pointer;
    }
    .btn-dismiss:hover {
      color: #172b4d;
    }

    /* Workspace sections */
    .workspaces-section-grid {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title-row h2 {
      font-size: 1.1rem;
      color: #172b4d;
      font-weight: 700;
      margin: 0;
    }
    .workspace-boards-block {
      border-top: 1px solid #dfe1e6;
      padding-top: 24px;
    }
    .ws-block-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .ws-block-avatar {
      width: 36px;
      height: 36px;
      background: #0052cc;
      color: white;
      font-size: 1.2rem;
      font-weight: 700;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ws-block-info {
      flex: 1;
    }
    .ws-block-info h3 {
      font-size: 0.95rem;
      margin: 0 0 2px 0;
      color: #172b4d;
    }
    .ws-block-info p {
      font-size: 0.8rem;
      margin: 0;
      color: #5e6c84;
    }
    .boards-grid-home {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 16px;
    }
    .board-card-home {
      height: 96px;
      border-radius: 3px;
      padding: 12px;
      color: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: filter 0.15s;
    }
    .board-card-home:hover {
      filter: brightness(0.9);
    }
    .board-card-home h3 {
      font-size: 1rem;
      margin: 0;
      font-weight: 700;
      line-height: 1.2;
    }
    .board-card-ws-name {
      font-size: 0.75rem;
      opacity: 0.85;
    }
    .create-board-card {
      background: #f4f5f7 !important;
      color: #172b4d;
      border: 1px solid #dfe1e6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .create-board-card:hover {
      background: #ebecf0 !important;
    }
    .empty-workspace-state {
      padding: 24px;
      background: #fafbfc;
      border: 1px dashed #dfe1e6;
      border-radius: 6px;
      text-align: center;
      color: #5e6c84;
    }

    /* Right sidebar */
    .home-right-panel {
      border-left: 1px solid #dfe1e6;
      padding: 24px 16px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .panel-section h3 {
      font-size: 0.85rem;
      color: #5e6c84;
      text-transform: uppercase;
      font-weight: 700;
      margin: 0;
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .panel-icon {
      font-size: 1.1rem;
    }
    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .recent-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .recent-item:hover {
      background: rgba(9, 30, 66, 0.08);
    }
    .recent-color {
      width: 36px;
      height: 28px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .recent-info h4 {
      font-size: 0.85rem;
      margin: 0;
      color: #172b4d;
      font-weight: 600;
    }
    .recent-info p {
      font-size: 0.72rem;
      margin: 0;
      color: #5e6c84;
    }
    .recent-empty {
      font-size: 0.8rem;
      color: #5e6c84;
    }

    /* My tasks panel */
    .my-tasks-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .my-task-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #172b4d;
      padding: 4px 0;
    }
    .my-task-status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-todo { background: #5e6c84; }
    .dot-inprogress { background: #ffab00; }
    .dot-done { background: #36b37e; }
    .my-task-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .btn-view-all-tasks {
      font-size: 0.8rem;
      color: #0052cc;
      text-decoration: none;
      font-weight: 500;
      margin-top: 6px;
    }
    .btn-view-all-tasks:hover { text-decoration: underline; }

    .btn-create-board-link {
      width: 100%;
      height: 36px;
      border: none;
      background: #f4f5f7;
      color: #42526e;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s, color 0.15s;
    }
    .btn-create-board-link:hover {
      background: #ebecf0;
      color: #172b4d;
    }
    .plus-sign {
      font-size: 1rem;
      font-weight: 700;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private boardService = inject(BoardService);
  private cardService = inject(CardService);
  private router = inject(Router);
  public auth = inject(AuthService);

  workspaces = signal<Workspace[]>([]);
  boards = signal<Board[]>([]);
  myCards = signal<CardItem[]>([]);
  recentBoards = signal<RecentBoard[]>([]);
  
  expandedWorkspaces = signal<Record<string, boolean>>({});
  showPromo = signal(true);
  showCreateModal = signal(false);
  showCreateWorkspaceModal = signal(false);

  // Board creation form
  newBoardName = '';
  newBoardDescription = '';
  newBoardWorkspaceId = '';

  // Workspace creation form
  newWorkspaceName = '';
  newWorkspaceDescription = '';

  private bgGradients = [
    'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
    'linear-gradient(135deg, #6554c0 0%, #403294 100%)',
    'linear-gradient(135deg, #00b8d9 0%, #008da6 100%)',
    'linear-gradient(135deg, #36b37e 0%, #1d7f54 100%)',
    'linear-gradient(135deg, #ffab00 0%, #ff8b00 100%)',
    'linear-gradient(135deg, #de350b 0%, #bf2600 100%)'
  ];

  ngOnInit() {
    const dismissed = localStorage.getItem('trello_promo_dismissed');
    if (dismissed === 'true') {
      this.showPromo.set(false);
    }

    if (this.auth.isAuthenticated()) {
      this.loadData();
      this.loadRecentBoards();
    }
  }

  async loadData() {
    try {
      const workspacesList = await this.workspaceService.getWorkspaces();
      this.workspaces.set(workspacesList);
      
      if (workspacesList.length > 0) {
        this.expandedWorkspaces.update(map => ({
          ...map,
          [workspacesList[0].id]: true
        }));
      }

      const boardsList = await this.boardService.getBoards();
      this.boards.set(boardsList);

      // Load assigned cards
      try {
        const currentUserId = this.auth.userId();
        if (currentUserId) {
          const allCards = await this.cardService.getAllCards();
          this.myCards.set(allCards.filter(c => c.assignedUserId === currentUserId));
        }
      } catch {}
    } catch {}
  }

  loadRecentBoards() {
    const stored = localStorage.getItem('trello_recent_boards');
    if (stored) {
      try {
        const parsed: RecentBoard[] = JSON.parse(stored);
        this.recentBoards.set(parsed.slice(0, 5));
      } catch {}
    }
  }

  trackBoardView(board: Board) {
    const wsName = this.workspaces().find(w => w.id === board.workspaceId)?.name ?? 'Workspace';
    const recent: RecentBoard = {
      id: board.id,
      name: board.name,
      workspaceName: wsName,
      viewedAt: Date.now()
    };

    let stored: RecentBoard[] = [];
    try {
      stored = JSON.parse(localStorage.getItem('trello_recent_boards') ?? '[]');
    } catch {}

    // Remove existing entry for this board, add to front
    stored = stored.filter(r => r.id !== board.id);
    stored.unshift(recent);
    stored = stored.slice(0, 5);
    localStorage.setItem('trello_recent_boards', JSON.stringify(stored));
    this.recentBoards.set(stored);
  }

  isWorkspaceExpanded(workspaceId: string): boolean {
    return !!this.expandedWorkspaces()[workspaceId];
  }

  toggleWorkspace(workspaceId: string) {
    this.expandedWorkspaces.update(map => ({
      ...map,
      [workspaceId]: !map[workspaceId]
    }));
  }

  getWorkspaceBoards(workspaceId: string): Board[] {
    return this.boards().filter(b => b.workspaceId === workspaceId);
  }

  goToBoard(boardId: string) {
    const board = this.boards().find(b => b.id === boardId);
    if (board) {
      this.trackBoardView(board);
    }
    this.router.navigate(['/boards'], { queryParams: { boardId } });
  }

  getBoardBg(boardId: string): string {
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % this.bgGradients.length;
    return this.bgGradients[idx];
  }

  countMyCardsByStatus(status: string): number {
    return this.myCards().filter(c => c.status === status).length;
  }

  countMyCardsByPriority(priority: string): number {
    return this.myCards().filter(c => c.priority === priority).length;
  }

  dismissPromo() {
    this.showPromo.set(false);
    localStorage.setItem('trello_promo_dismissed', 'true');
  }

  openCreateBoardModal(workspaceId?: string) {
    this.newBoardName = '';
    this.newBoardDescription = '';
    if (workspaceId) {
      this.newBoardWorkspaceId = workspaceId;
    } else if (this.workspaces().length > 0) {
      this.newBoardWorkspaceId = this.workspaces()[0].id;
    } else {
      this.newBoardWorkspaceId = '';
    }
    this.showCreateModal.set(true);
  }

  openCreateWorkspaceModal() {
    this.newWorkspaceName = '';
    this.newWorkspaceDescription = '';
    this.showCreateWorkspaceModal.set(true);
  }

  async createBoardSubmit() {
    if (!this.newBoardName.trim() || !this.newBoardWorkspaceId) return;

    try {
      const board = await this.boardService.createBoard({
        workspaceId: this.newBoardWorkspaceId,
        name: this.newBoardName.trim(),
        description: this.newBoardDescription.trim() || undefined,
        createdById: this.auth.userId() || '00000000-0000-0000-0000-000000000000'
      });
      this.boards.update(current => [...current, board]);
      this.showCreateModal.set(false);
      this.goToBoard(board.id);
    } catch {}
  }

  async createWorkspaceSubmit() {
    if (!this.newWorkspaceName.trim()) return;

    try {
      const workspace = await this.workspaceService.createWorkspace({
        name: this.newWorkspaceName.trim(),
        description: this.newWorkspaceDescription.trim() || undefined,
        ownerId: this.auth.userId() || '00000000-0000-0000-0000-000000000000'
      });
      this.workspaces.update(current => [...current, workspace]);
      this.showCreateWorkspaceModal.set(false);
      this.expandedWorkspaces.update(map => ({ ...map, [workspace.id]: true }));
    } catch {}
  }
}
