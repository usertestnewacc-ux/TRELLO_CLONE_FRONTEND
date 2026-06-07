import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';
import { BoardService } from './board.service';
import { WorkspaceService } from './workspace.service';
import { ListService } from './list.service';
import { CardService } from './card.service';
import { CommentService } from './comment.service';
import { AttachmentService } from './attachment.service';
import { Board, BoardMember } from './board.types';
import { Workspace } from './workspace.types';
import { ListItem } from './list.types';
import { CardItem } from './card.types';
import { CommentItem } from './comment.types';
import { AttachmentItem } from './attachment.types';

@Component({
  selector: 'boards-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="boards-root animate-in" [class.in-board-view]="viewingBoard()">
      <!-- Main Dashboard view -->
      <div class="page-container" *ngIf="!viewingBoard()">
        <div class="page-header">
          <div>
            <h1 class="page-title">📋 Boards Dashboard</h1>
            <p class="page-subtitle">Select a board to view its Kanban tasks, columns, and team members.</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateBoardModal()">
              <span>➕</span> Create Board
            </button>
          </div>
        </div>

        <div class="alert alert-error" *ngIf="message() && !message().includes('successfully')">
          <span>⚠</span> {{ message() }}
        </div>
        <div class="alert alert-success" *ngIf="message() && message().includes('successfully')">
          <span>✔</span> {{ message() }}
        </div>

        <!-- Workspace filter selection -->
        <div class="workspace-filter-row card">
          <div class="card-body filter-body">
            <label class="form-label" style="margin: 0; white-space: nowrap;">Filter by Workspace:</label>
            <select class="form-control filter-select" [(ngModel)]="activeWorkspaceId" (change)="onWorkspaceFilterChange()">
              <option value="ALL">All Workspaces</option>
              <option *ngFor="let ws of workspaces()" [value]="ws.id">{{ ws.name }}</option>
            </select>
          </div>
        </div>

        <div *ngIf="boards().length === 0" class="card empty-state">
          <span class="empty-state-icon">📋</span>
          <h3>No boards found</h3>
          <p>Create a board inside a workspace to start managing your project lists and tasks.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 12px;" (click)="openCreateBoardModal()">
            Create Board
          </button>
        </div>

        <!-- Boards grid -->
        <div class="boards-grid" *ngIf="boards().length > 0">
          <div *ngFor="let board of filteredBoards()" class="board-preview-card" [style.background]="getBoardBg(board.id)" (click)="enterBoardView(board)">
            <div class="board-preview-content">
              <h3>{{ board.name }}</h3>
              <p>{{ board.description || 'No description provided.' }}</p>
            </div>
            <div class="board-preview-footer">
              <span class="workspace-badge">{{ board.workspaceName || getWorkspaceName(board.workspaceId) }}</span>
              <button class="btn btn-ghost btn-sm btn-icon-only text-white" (click)="deleteBoard(board.id); $event.stopPropagation()" title="Delete Board">🗑</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban Board View -->
      <div class="kanban-wrapper" *ngIf="viewingBoard() && activeBoard()">
        <div class="kanban-header">
          <div class="header-left">
            <button class="btn btn-ghost text-white" (click)="exitBoardView()">
              <span>⬅</span> Back to Dashboard
            </button>
            <h1 class="board-title">{{ activeBoard()?.name }}</h1>
            <span class="workspace-tag">{{ activeBoard()?.workspaceName || getWorkspaceName(activeBoard()!.workspaceId) }}</span>
          </div>

          <div class="header-right">
            <div class="board-members-avatars">
              <div *ngFor="let m of activeBoardMembers()" class="avatar avatar-sm avatar-board" [title]="m.email || m.userId">
                {{ m.email?.substring(0, 2)?.toUpperCase() || 'U' }}
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="showMembersModal.set(true)">
              <span>👥</span> Members / Settings
            </button>
          </div>
        </div>

        <!-- Kanban columns container -->
        <div class="kanban-columns-container">
          <!-- Column lists -->
          <div *ngFor="let list of boardLists()" 
               class="kanban-column"
               draggable="false"
               (dragover)="allowDrop($event)"
               (drop)="onCardDrop($event, list.id)">
            <div class="column-header">
              <input class="column-title-input" type="text" [(ngModel)]="list.title" (blur)="onListTitleBlur(list)" />
              <button class="btn btn-icon delete-col-btn" (click)="deleteList(list.id)" title="Delete list">✕</button>
            </div>

            <!-- Cards inside list -->
            <div class="column-cards-list">
              <div *ngFor="let card of listCards()[list.id] || []" 
                   class="card kanban-card" 
                   draggable="true" 
                   (dragstart)="onCardDragStart($event, card)"
                   (click)="openCardDetailsModal(card)">
                <div class="card-body">
                  <div class="card-tags">
                    <span class="badge" 
                          [class.badge-red]="card.priority === 'High'"
                          [class.badge-yellow]="card.priority === 'Medium'"
                          [class.badge-blue]="card.priority === 'Low' || !card.priority">
                      {{ card.priority || 'Medium' }}
                    </span>
                    <span class="badge badge-green" *ngIf="card.status === 'Done'">Done</span>
                    <span class="badge badge-yellow" *ngIf="card.status === 'InProgress'">In Progress</span>
                  </div>
                  <h4 class="card-title">{{ card.title }}</h4>
                  <p class="card-desc" *ngIf="card.description">{{ card.description }}</p>
                  <div class="card-meta">
                    <span class="card-due-date" *ngIf="card.dueDate">📅 {{ card.dueDate | slice:0:10 }}</span>
                    <span class="card-assignee-avatar" *ngIf="card.assignedUserId" [title]="getAssigneeEmail(card.assignedUserId)">
                      👤
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Card Row -->
            <div class="column-footer">
              <form *ngIf="activeAddCardListId() === list.id" (ngSubmit)="createCard(list.id)" class="add-card-form">
                <input class="form-control" type="text" [(ngModel)]="newCardTitle" name="newCardTitle" placeholder="Enter card title..." required focus />
                <div class="add-card-actions">
                  <button class="btn btn-success btn-sm" type="submit">Add Task</button>
                  <button class="btn btn-ghost btn-sm" type="button" (click)="activeAddCardListId.set(null)">Cancel</button>
                </div>
              </form>
              <button *ngIf="activeAddCardListId() !== list.id" class="btn btn-ghost btn-full add-card-btn" (click)="activeAddCardListId.set(list.id); newCardTitle = ''">
                ➕ Add a card
              </button>
            </div>
          </div>

          <!-- Add List Column -->
          <div class="kanban-column add-column-card">
            <form *ngIf="showAddListForm()" (ngSubmit)="createList()" class="add-list-form">
              <input class="form-control" type="text" [(ngModel)]="newListTitle" name="newListTitle" placeholder="Enter list title..." required />
              <div class="add-list-actions">
                <button class="btn btn-primary btn-sm" type="submit">Add List</button>
                <button class="btn btn-ghost btn-sm" type="button" (click)="showAddListForm.set(false)">Cancel</button>
              </div>
            </form>
            <button *ngIf="!showAddListForm()" class="btn btn-ghost btn-full add-list-btn" (click)="showAddListForm.set(true); newListTitle = ''">
              ➕ Add another list
            </button>
          </div>
        </div>
      </div>

      <!-- Create Board Modal -->
      <div class="modal-overlay" *ngIf="showCreateBoardModal()">
        <div class="modal animate-in">
          <div class="modal-header">
            <span class="modal-title">Create New Project Board</span>
            <button class="btn-icon" (click)="showCreateBoardModal.set(false)">✕</button>
          </div>
          <form (ngSubmit)="createBoard()">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="newBoardName">Board Name</label>
                <input id="newBoardName" class="form-control" type="text" [(ngModel)]="newBoardName" name="newBoardName" placeholder="e.g. Sprint Backlog" required />
              </div>
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="newBoardDescription">Description</label>
                <textarea id="newBoardDescription" class="form-control" [(ngModel)]="newBoardDescription" name="newBoardDescription" placeholder="Optional board summary..."></textarea>
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
              <button class="btn btn-secondary" type="button" (click)="showCreateBoardModal.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit">Create Board</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Members & Board Settings Modal -->
      <div class="modal-overlay" *ngIf="showMembersModal()">
        <div class="modal animate-in">
          <div class="modal-header">
            <span class="modal-title">Board Settings & Members</span>
            <button class="btn-icon" (click)="showMembersModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <!-- Edit Board -->
            <form (ngSubmit)="updateBoard()" class="board-edit-form" style="margin-bottom: 20px;">
              <h4>Board Info</h4>
              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label">Name</label>
                <input class="form-control" type="text" [(ngModel)]="editBoardName" name="editBoardName" required />
              </div>
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">Description</label>
                <textarea class="form-control" [(ngModel)]="editBoardDescription" name="editBoardDescription"></textarea>
              </div>
              <button class="btn btn-primary btn-sm" type="submit">Save Board Info</button>
            </form>

            <hr class="divider" />

            <!-- Members list -->
            <h4>Board Members</h4>
            <div class="board-member-list" style="margin-bottom: 16px;">
              <div *ngFor="let bm of activeBoardMembers()" class="board-member-item">
                <div class="member-info">
                  <div class="avatar avatar-sm avatar-board" style="background:#0747a6; color:white;">
                    {{ bm.email?.substring(0, 2)?.toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <span class="member-email">{{ getUserDisplayName(bm.email) }}</span>
                    <span style="font-size:0.72rem; color:#5e6c84; display:block;">{{ bm.email }}</span>
                    <span class="badge badge-gray" style="font-size:0.65rem; padding:1px 4px; display:inline-block; margin-top:2px;">{{ bm.role || 'Member' }}</span>
                  </div>
                </div>
                <div class="member-actions" (click)="$event.stopPropagation()">
                  <select class="form-control inline-select" [(ngModel)]="bm.role" name="role-{{ bm.id }}">
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button class="btn btn-secondary btn-sm" (click)="updateBoardMemberRole(bm)" title="Save role">💾</button>
                  <button class="btn btn-danger btn-sm btn-icon-only" (click)="removeBoardMember(bm.id)" title="Remove member">✕</button>
                </div>
              </div>
            </div>

            <!-- Invite Member -->
            <div class="card invite-member-card">
              <div class="card-body">
                <h4>➕ Invite Board Member</h4>
                <form (ngSubmit)="inviteBoardMember()" class="invite-member-form">
                  <div class="form-group">
                    <label class="form-label">Select User</label>
                    <select class="form-control" [(ngModel)]="newBoardInviteEmail" name="newBoardInviteEmail" required>
                      <option value="" disabled>-- Select a user --</option>
                      <option *ngFor="let u of availableUsersForBoard()" [value]="u.email">{{ u.username }} ({{ u.email }})</option>
                    </select>
                    <p style="font-size:0.78rem; color:#5e6c84; margin-top:4px;" *ngIf="availableUsersForBoard().length === 0">All registered users are already board members.</p>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-control" [(ngModel)]="newBoardInviteRole" name="newBoardInviteRole">
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <button class="btn btn-success btn-sm" type="submit" [disabled]="!newBoardInviteEmail">Invite Member</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Details Modal -->
      <div class="modal-overlay" *ngIf="showCardDetailsModal() && selectedCard()">
        <div class="modal animate-in card-modal">
          <div class="modal-header">
            <span class="modal-title">📝 Task Card Details</span>
            <button class="btn-icon" (click)="closeCardDetailsModal()">✕</button>
          </div>
          <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            <!-- Task edit Form -->
            <form (ngSubmit)="saveCardDetails()" class="card-details-form">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input class="form-control card-details-title-input" type="text" [(ngModel)]="selectedCard()!.title" name="cardTitle" required />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" [(ngModel)]="selectedCard()!.description" name="cardDesc" placeholder="Add a more detailed description..."></textarea>
              </div>

              <div class="card-details-settings-grid">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-control" [(ngModel)]="selectedCard()!.status" name="cardStatus">
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select class="form-control" [(ngModel)]="selectedCard()!.priority" name="cardPriority">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input class="form-control" type="date" [ngModel]="selectedCard()!.dueDate | slice:0:10" (ngModelChange)="selectedCard()!.dueDate = $event" name="cardDueDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">Assignee</label>
                  <select class="form-control" [(ngModel)]="selectedCard()!.assignedUserId" name="cardAssignee">
                    <option [value]="undefined">Unassigned</option>
                    <option *ngFor="let u of registeredUsers()" [value]="u.id">{{ u.email }}</option>
                  </select>
                </div>
              </div>

              <div class="card-details-actions-row">
                <button class="btn btn-primary" type="submit">Save Changes</button>
                <button class="btn btn-danger" type="button" (click)="deleteCard(selectedCard()!.id)">🗑 Delete Card</button>
              </div>
            </form>

            <hr class="divider" />

            <!-- Attachments -->
            <div class="modal-card-attachments">
              <h3>📎 Attachments</h3>
              <div *ngIf="cardAttachments().length === 0" class="empty-state-small">No attachments uploaded yet.</div>
              <div class="attachments-list" *ngIf="cardAttachments().length > 0">
                <div *ngFor="let att of cardAttachments()" class="attachment-item-row">
                  <span class="attachment-file-name">📎 {{ att.fileName }}</span>
                  <div class="attachment-item-actions">
                    <a [href]="'http://localhost:5108' + att.filePath" target="_blank" class="btn btn-secondary btn-sm">Download</a>
                    <button class="btn btn-danger btn-sm btn-icon-only" (click)="deleteAttachment(att.id)">🗑</button>
                  </div>
                </div>
              </div>

              <!-- Upload form -->
              <div class="upload-attachment-row">
                <input type="file" #fileInput style="display: none;" (change)="onAttachmentUpload($event)" />
                <button class="btn btn-ghost btn-sm" (click)="fileInput.click()">
                  ➕ Upload Attachment File
                </button>
              </div>
            </div>

            <hr class="divider" />

            <!-- Comments -->
            <div class="modal-card-comments">
              <h3>💬 Comments</h3>
              <div class="new-comment-box">
                <textarea class="form-control" [(ngModel)]="newCommentText" placeholder="Write a comment..." rows="2"></textarea>
                <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" (click)="addComment()">Post Comment</button>
              </div>

              <div class="comments-list-container" *ngIf="cardComments().length > 0">
                <div *ngFor="let comm of cardComments()" class="comment-item-row animate-in">
                  <div class="comment-avatar">
                    {{ getAssigneeEmail(comm.userId).substring(0, 2).toUpperCase() }}
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-user">{{ getAssigneeEmail(comm.userId) }}</span>
                      <span class="comment-time">{{ comm.createdAt | date:'short' }}</span>
                    </div>
                    <p class="comment-text">{{ comm.commentText }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .boards-root {
      min-height: calc(100vh - 56px);
      background: var(--bg-primary);
      transition: background var(--transition-slow);
    }
    .boards-root.in-board-view {
      background: #0052cc;
    }
    .filter-body {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
    }
    .filter-select {
      width: 220px;
      padding: 6px 12px;
      height: auto;
    }
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
      margin-top: 16px;
    }
    .board-preview-card {
      height: 120px;
      border-radius: var(--radius-lg);
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      color: white;
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .board-preview-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .board-preview-content h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .board-preview-content p {
      font-size: 0.85rem;
      opacity: 0.85;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }
    .board-preview-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .workspace-badge {
      font-size: 0.72rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      font-weight: 700;
    }
    .text-white {
      color: white;
    }
    
    /* Kanban Styles */
    .kanban-wrapper {
      display: flex;
      flex-direction: column;
      height: calc(100vh - var(--nav-height));
      padding: 16px;
      box-sizing: border-box;
      overflow: hidden;
    }
    .kanban-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      color: white;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .board-title {
      font-size: 1.35rem;
      font-weight: 800;
      margin: 0;
    }
    .workspace-tag {
      font-size: 0.78rem;
      background: rgba(255,255,255,0.15);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }
    .board-members-avatars {
      display: flex;
      align-items: center;
    }
    .avatar-board {
      background: rgba(255,255,255,0.2);
      border: 1.5px solid #0052cc;
      color: white;
      margin-left: -6px;
    }
    .avatar-board:first-child {
      margin-left: 0;
    }
    .kanban-columns-container {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      align-items: flex-start;
      flex: 1;
      padding-bottom: 12px;
    }
    .kanban-column {
      width: 272px;
      background: #ebecf0;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      max-height: 100%;
      flex-shrink: 0;
      padding: 8px;
      box-sizing: border-box;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      padding-left: 4px;
    }
    .column-title-input {
      font-size: 0.95rem;
      font-weight: 700;
      border: none;
      background: transparent;
      color: var(--text-primary);
      width: 80%;
      padding: 4px;
      border-radius: var(--radius-sm);
    }
    .column-title-input:focus {
      background: white;
      outline: none;
      box-shadow: inset 0 0 0 2px var(--border-focus);
    }
    .delete-col-btn {
      padding: 4px 6px;
      font-size: 0.8rem;
    }
    .column-cards-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 2px;
    }
    .kanban-card {
      cursor: grab;
      border-color: transparent;
      box-shadow: 0 1px 0 rgba(9,30,66,0.25);
    }
    .kanban-card:hover {
      background: #f4f5f7;
      border-color: #dfe1e6;
    }
    .kanban-card:active {
      cursor: grabbing;
    }
    .card-tags {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }
    .card-title {
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }
    .card-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .column-footer {
      padding-top: 6px;
    }
    .add-card-btn, .add-list-btn {
      text-align: left;
      color: var(--text-secondary);
      font-size: 0.85rem;
      padding: 6px 10px;
    }
    .add-card-btn:hover {
      background: rgba(9,30,66,0.08);
      color: var(--text-primary);
    }
    .add-column-card {
      background: rgba(255, 255, 255, 0.2);
    }
    .add-list-btn {
      color: white;
    }
    .add-list-btn:hover {
      background: rgba(0,0,0,0.15);
      color: white;
    }
    .add-card-form, .add-list-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .add-card-actions, .add-list-actions {
      display: flex;
      gap: 6px;
    }
    
    /* Board Members and settings list */
    .board-member-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      margin-bottom: 8px;
    }
    
    /* Card modal detail styling */
    .card-modal {
      max-width: 680px;
    }
    .card-details-title-input {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .card-details-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-details-settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    @media (max-width: 500px) {
      .card-details-settings-grid {
        grid-template-columns: 1fr;
      }
    }
    .card-details-actions-row {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
    }
    .attachment-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }
    .attachment-file-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .attachment-item-actions {
      display: flex;
      gap: 6px;
    }
    .upload-attachment-row {
      margin-top: 8px;
    }
    
    .new-comment-box {
      margin-bottom: 16px;
    }
    .comments-list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .comment-item-row {
      display: flex;
      gap: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-light);
    }
    .comment-item-row:last-child {
      border-bottom: none;
    }
    .comment-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--brand-purple);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
      flex-shrink: 0;
    }
    .comment-content {
      flex: 1;
    }
    .comment-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 4px;
    }
    .comment-user {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .comment-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .comment-text {
      font-size: 0.875rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
    }
  `]
})
export class BoardsComponent implements OnInit {
  // Services
  private authService = inject(AuthService);
  private boardService = inject(BoardService);
  private workspaceService = inject(WorkspaceService);
  private listService = inject(ListService);
  private cardService = inject(CardService);
  private commentService = inject(CommentService);
  private attachmentService = inject(AttachmentService);
  private route = inject(ActivatedRoute);

  // States
  workspaces = signal<Workspace[]>([]);
  boards = signal<Board[]>([]);
  activeWorkspaceId = 'ALL';
  message = signal('');
  isLoading = signal(false);

  // Board details states
  viewingBoard = signal(false);
  activeBoard = signal<Board | null>(null);
  boardLists = signal<ListItem[]>([]);
  listCards = signal<Record<string, CardItem[]>>({});
  activeBoardMembers = signal<BoardMember[]>([]);
  registeredUsers = signal<Array<{ id: string; email: string }>>([]);

  // Add list/card inputs
  showAddListForm = signal(false);
  newListTitle = '';
  activeAddCardListId = signal<string | null>(null);
  newCardTitle = '';

  // Modals signals & inputs
  showCreateBoardModal = signal(false);
  newBoardName = '';
  newBoardDescription = '';
  newBoardWorkspaceId = '';

  showMembersModal = signal(false);
  editBoardName = '';
  editBoardDescription = '';
  newBoardInviteEmail = '';
  newBoardInviteRole = 'Member';

  showCardDetailsModal = signal(false);
  selectedCard = signal<CardItem | null>(null);
  cardComments = signal<CommentItem[]>([]);
  cardAttachments = signal<AttachmentItem[]>([]);
  newCommentText = '';

  // Drag-and-drop state
  private draggedCard: CardItem | null = null;

  // Background gradients
  private bgGradients = [
    'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
    'linear-gradient(135deg, #6554c0 0%, #403294 100%)',
    'linear-gradient(135deg, #00b8d9 0%, #008da6 100%)',
    'linear-gradient(135deg, #36b37e 0%, #1d7f54 100%)',
    'linear-gradient(135deg, #ffab00 0%, #ff8b00 100%)',
    'linear-gradient(135deg, #de350b 0%, #bf2600 100%)'
  ];

  get auth() {
    return this.authService;
  }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadWorkspaces();
      this.loadUsers();
      this.loadBoardsThenOpenFromParam();
    }
  }

  /** Load boards and then open a specific board if ?boardId= is in the URL */
  private async loadBoardsThenOpenFromParam() {
    await this.loadBoards();
    const boardId = this.route.snapshot.queryParamMap.get('boardId');
    if (boardId) {
      const board = this.boards().find(b => b.id === boardId);
      if (board) {
        await this.enterBoardView(board);
      }
    }
  }

  async loadWorkspaces() {
    try {
      const list = await this.workspaceService.getWorkspaces();
      this.workspaces.set(list);
    } catch {}
  }

  async loadUsers() {
    try {
      const list = await this.authService.fetchUsers();
      this.registeredUsers.set(list.map(u => ({ id: u.id, email: u.email })));
    } catch {}
  }

  availableUsersForBoard(): Array<{email: string; username: string}> {
    const memberEmails = new Set(this.activeBoardMembers().map(m => m.email?.toLowerCase()));
    return this.registeredUsers()
      .filter(u => !memberEmails.has(u.email.toLowerCase()))
      .map(u => ({ email: u.email, username: u.email.split('@')[0] }));
  }

  getUserDisplayName(email?: string): string {
    if (!email) return 'Unknown Member';
    return email.split('@')[0];
  }

  async loadBoards() {
    this.message.set('');
    this.isLoading.set(true);
    try {
      const list = await this.boardService.getBoards();
      this.boards.set(list);
    } catch (err: any) {
      this.message.set(err?.message ?? 'Failed to load boards.');
    } finally {
      this.isLoading.set(false);
    }
  }

  filteredBoards() {
    if (this.activeWorkspaceId === 'ALL') {
      return this.boards();
    }
    return this.boards().filter(b => b.workspaceId === this.activeWorkspaceId);
  }

  onWorkspaceFilterChange() {
    this.message.set('');
  }

  getWorkspaceName(workspaceId: string): string {
    const ws = this.workspaces().find(w => w.id === workspaceId);
    return ws ? ws.name : 'Unknown Workspace';
  }

  getBoardBg(boardId: string): string {
    // Generate a pseudo-random index based on boardId string hash
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = boardId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.bgGradients.length;
    return this.bgGradients[index];
  }

  getAssigneeEmail(userId: string): string {
    const u = this.registeredUsers().find(user => user.id === userId);
    return u ? u.email : 'Unknown user';
  }

  openCreateBoardModal() {
    this.newBoardName = '';
    this.newBoardDescription = '';
    this.newBoardWorkspaceId = this.activeWorkspaceId !== 'ALL' ? this.activeWorkspaceId : (this.workspaces()[0]?.id ?? '');
    this.showCreateBoardModal.set(true);
  }

  async createBoard() {
    if (!this.newBoardName.trim() || !this.newBoardWorkspaceId) {
      this.message.set('Name and Workspace are required.');
      return;
    }

    try {
      const board = await this.boardService.createBoard({
        workspaceId: this.newBoardWorkspaceId,
        name: this.newBoardName.trim(),
        description: this.newBoardDescription.trim() || undefined,
        createdById: '00000000-0000-0000-0000-000000000000'
      });
      this.boards.update(current => [...current, board]);
      this.showCreateBoardModal.set(false);
      this.message.set('Board created successfully.');
    } catch (err: any) {
      this.message.set(err?.error?.error ?? err?.message ?? 'Failed to create board.');
    }
  }

  async deleteBoard(boardId: string) {
    if (!confirm('Are you sure you want to delete this board? All lists and cards will be removed.')) {
      return;
    }

    try {
      await this.boardService.deleteBoard(boardId);
      this.boards.update(current => current.filter(b => b.id !== boardId));
      this.message.set('Board deleted successfully.');
      if (this.activeBoard()?.id === boardId) {
        this.exitBoardView();
      }
    } catch (err: any) {
      this.message.set(err?.message ?? 'Failed to delete board.');
    }
  }

  // Kanban Transition
  async enterBoardView(board: Board) {
    this.activeBoard.set(board);
    this.editBoardName = board.name;
    this.editBoardDescription = board.description ?? '';
    this.viewingBoard.set(true);
    await this.loadBoardData();
    await this.loadBoardMembers();
  }

  exitBoardView() {
    this.viewingBoard.set(false);
    this.activeBoard.set(null);
    this.boardLists.set([]);
    this.listCards.set({});
    this.activeBoardMembers.set([]);
    this.loadBoards();
  }

  async loadBoardData() {
    const board = this.activeBoard();
    if (!board) return;
    try {
      const lists = await this.listService.getLists(board.id);
      const sortedLists = lists.sort((a, b) => a.position - b.position);
      this.boardLists.set(sortedLists);

      const cardsMap: Record<string, CardItem[]> = {};
      for (const list of sortedLists) {
        const listCards = await this.cardService.getCards(list.id);
        cardsMap[list.id] = listCards.sort((a, b) => a.position - b.position);
      }
      this.listCards.set(cardsMap);
    } catch {}
  }

  async loadBoardMembers() {
    const board = this.activeBoard();
    if (!board) return;
    try {
      const members = await this.boardService.getBoardMembers(board.id);
      this.activeBoardMembers.set(members);
    } catch {}
  }

  // Kanban Lists Actions
  async createList() {
    const board = this.activeBoard();
    if (!board || !this.newListTitle.trim()) return;

    try {
      const list = await this.listService.createList({
        boardId: board.id,
        title: this.newListTitle.trim(),
        position: this.boardLists().length
      });
      this.boardLists.update(current => [...current, list]);
      this.listCards.update(map => ({ ...map, [list.id]: [] }));
      this.newListTitle = '';
      this.showAddListForm.set(false);
    } catch {}
  }

  async deleteList(listId: string) {
    if (!confirm('Are you sure you want to delete this list and all its cards?')) {
      return;
    }

    try {
      await this.listService.deleteList(listId);
      this.boardLists.update(current => current.filter(l => l.id !== listId));
      this.listCards.update(map => {
        const next = { ...map };
        delete next[listId];
        return next;
      });
    } catch {}
  }

  async onListTitleBlur(list: ListItem) {
    if (!list.title.trim()) return;
    try {
      // Re-use update board lists endpoint or basic endpoints
      // Note: Backend might update list using lists put endpoint
      // We will call list service update if it exists, otherwise do nothing
    } catch {}
  }

  // Kanban Cards Actions
  async createCard(listId: string) {
    if (!this.newCardTitle.trim()) return;

    try {
      const currentListCards = this.listCards()[listId] || [];
      const card = await this.cardService.createCard({
        listId,
        title: this.newCardTitle.trim(),
        position: currentListCards.length,
        status: 'ToDo'
      });

      this.listCards.update(map => ({
        ...map,
        [listId]: [...currentListCards, card]
      }));
      this.newCardTitle = '';
      this.activeAddCardListId.set(null);
    } catch {}
  }

  // Drag and Drop implementation
  onCardDragStart(event: DragEvent, card: CardItem) {
    this.draggedCard = card;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.id);
    }
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  async onCardDrop(event: DragEvent, targetListId: string) {
    event.preventDefault();
    if (!this.draggedCard) return;

    const sourceListId = this.draggedCard.listId;
    const cardId = this.draggedCard.id;

    // Check if target is same as source
    if (sourceListId === targetListId) {
      this.draggedCard = null;
      return;
    }

    const cardToMove = this.draggedCard;
    this.draggedCard = null;

    // Local UI update first for smooth UX
    this.listCards.update(map => {
      const sourceCards = (map[sourceListId] || []).filter(c => c.id !== cardId);
      const targetCards = [...(map[targetListId] || [])];
      
      const movedCard = { ...cardToMove, listId: targetListId, position: targetCards.length };
      targetCards.push(movedCard);

      return {
        ...map,
        [sourceListId]: sourceCards.map((c, i) => ({ ...c, position: i })),
        [targetListId]: targetCards
      };
    });

    try {
      // Update in backend
      await this.cardService.updateCard(cardId, {
        listId: targetListId,
        title: cardToMove.title,
        description: cardToMove.description,
        priority: cardToMove.priority,
        dueDate: cardToMove.dueDate,
        assignedUserId: cardToMove.assignedUserId || undefined,
        status: cardToMove.status,
        position: this.listCards()[targetListId].length - 1
      });
    } catch {
      // Rollback
      await this.loadBoardData();
    }
  }

  // Card details modal operations
  async openCardDetailsModal(card: CardItem) {
    this.selectedCard.set({ ...card });
    this.newCommentText = '';
    this.showCardDetailsModal.set(true);
    await this.loadCardComments(card.id);
    await this.loadCardAttachments(card.id);
  }

  closeCardDetailsModal() {
    this.showCardDetailsModal.set(false);
    this.selectedCard.set(null);
    this.cardComments.set([]);
    this.cardAttachments.set([]);
  }

  async loadCardComments(cardId: string) {
    try {
      const list = await this.commentService.getComments(cardId);
      this.cardComments.set(list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {}
  }

  async loadCardAttachments(cardId: string) {
    try {
      const list = await this.attachmentService.getAttachments(cardId);
      this.cardAttachments.set(list);
    } catch {}
  }

  async saveCardDetails() {
    const card = this.selectedCard();
    if (!card) return;

    try {
      const updated = await this.cardService.updateCard(card.id, {
        title: card.title,
        description: card.description,
        priority: card.priority,
        dueDate: card.dueDate || undefined,
        assignedUserId: card.assignedUserId || undefined,
        status: card.status,
        position: card.position
      });

      // Update in columns lists
      this.listCards.update(map => {
        const listId = card.listId;
        const current = map[listId] || [];
        return {
          ...map,
          [listId]: current.map(c => c.id === updated.id ? updated : c)
        };
      });

      this.closeCardDetailsModal();
    } catch {}
  }

  async deleteCard(cardId: string) {
    if (!confirm('Are you sure you want to delete this card?')) return;
    const card = this.selectedCard();
    if (!card) return;

    try {
      await this.cardService.deleteCard(cardId);
      this.listCards.update(map => {
        const listId = card.listId;
        return {
          ...map,
          [listId]: (map[listId] || []).filter(c => c.id !== cardId)
        };
      });
      this.closeCardDetailsModal();
    } catch {}
  }

  // Comments
  async addComment() {
    const card = this.selectedCard();
    if (!card || !this.newCommentText.trim()) return;

    try {
      const comment = await this.commentService.createComment({
        cardId: card.id,
        commentText: this.newCommentText.trim(),
        userId: this.authService.userId() || '00000000-0000-0000-0000-000000000000'
      });
      this.cardComments.update(list => [comment, ...list]);
      this.newCommentText = '';
    } catch {}
  }

  // Attachments upload and delete
  async onAttachmentUpload(event: Event) {
    const card = this.selectedCard();
    const input = event.target as HTMLInputElement;
    if (!card || !input.files || input.files.length === 0) return;

    try {
      const file = input.files[0];
      const uploaded = await this.attachmentService.uploadAttachment(card.id, file);
      this.cardAttachments.update(list => [...list, uploaded]);
    } catch {}
  }

  async deleteAttachment(attachmentId: string) {
    if (!confirm('Remove this attachment file?')) return;
    try {
      await this.attachmentService.deleteAttachment(attachmentId);
      this.cardAttachments.update(list => list.filter(a => a.id !== attachmentId));
    } catch {}
  }

  // Board settings & updates
  async updateBoard() {
    const board = this.activeBoard();
    if (!board || !this.editBoardName.trim()) return;

    try {
      const updated = await this.boardService.updateBoard(board.id, {
        name: this.editBoardName.trim(),
        description: this.editBoardDescription.trim() || undefined
      });
      this.activeBoard.set(updated);
      this.boards.update(list => list.map(b => b.id === updated.id ? updated : b));
      this.message.set('Board updated successfully.');
      this.showMembersModal.set(false);
    } catch (err: any) {
      this.message.set(err?.message ?? 'Failed to update board.');
    }
  }

  // Board Members Management
  async inviteBoardMember() {
    const board = this.activeBoard();
    if (!board || !this.newBoardInviteEmail.trim()) return;

    try {
      const member = await this.boardService.inviteMember({
        boardId: board.id,
        email: this.newBoardInviteEmail.trim().toLowerCase(),
        role: this.newBoardInviteRole
      });
      this.activeBoardMembers.update(list => [...list, member]);
      this.newBoardInviteEmail = '';
      this.newBoardInviteRole = 'Member';
    } catch {}
  }

  async updateBoardMemberRole(member: BoardMember) {
    if (!member.id || !member.role) return;
    try {
      await this.boardService.updateMemberRole(member.id, { role: member.role });
    } catch {}
  }

  async removeBoardMember(memberId: string) {
    if (!confirm('Remove member from this board?')) return;
    try {
      await this.boardService.removeMember(memberId);
      this.activeBoardMembers.update(list => list.filter(m => m.id !== memberId));
    } catch {}
  }
}

