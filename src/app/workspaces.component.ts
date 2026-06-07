import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, AuthUser } from './auth.service';
import { WorkspaceService } from './workspace.service';
import { BoardService } from './board.service';
import { Workspace, WorkspaceMember } from './workspace.types';
import { Board, BoardMember } from './board.types';

@Component({
  selector: 'workspaces-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-page-root animate-in">
      
      <!-- Top header bar for active workspace information -->
      <header class="ws-header-nav" *ngIf="selectedWorkspace()">
        <div class="ws-header-logo">
          {{ selectedWorkspace()?.name?.substring(0, 1)?.toUpperCase() }}
        </div>
        <div class="ws-header-desc">
          <div class="ws-header-title-row">
            <h2>{{ selectedWorkspace()?.name }}</h2>
            <span class="edit-icon-ws" (click)="activeSettingsTab.set('settings')">✏️</span>
          </div>
          <p class="ws-header-meta">
            <span class="badge badge-purple">Premium</span>
            <span class="badge badge-gray">🔒 Private</span>
          </p>
        </div>
      </header>

      <!-- Main Columns Layout -->
      <div class="workspace-main-container">
        
        <!-- Left Sidebar settings menu -->
        <aside class="ws-settings-sidebar">
          <div class="sidebar-section">
            <h4>Personal Settings</h4>
            <ul class="settings-menu-list">
              <li [class.active]="activeSettingsTab() === 'profile'" (click)="activeSettingsTab.set('profile')">
                <span>👤</span> Profile and Visibility
              </li>
              <li [class.active]="activeSettingsTab() === 'activity'" (click)="activeSettingsTab.set('activity')">
                <span>🕒</span> Activity
              </li>
              <li [class.active]="activeSettingsTab() === 'cards'" (click)="activeSettingsTab.set('cards')">
                <span>📋</span> Cards
              </li>
              <li [class.active]="activeSettingsTab() === 'personal-settings'" (click)="activeSettingsTab.set('personal-settings')">
                <span>⚙️</span> Settings
              </li>
              <li [class.active]="activeSettingsTab() === 'labs'" (click)="activeSettingsTab.set('labs')">
                <span>🧪</span> Labs
              </li>
            </ul>
          </div>

          <div class="sidebar-section" *ngIf="selectedWorkspace()">
            <h4>Workspace</h4>
            <div class="ws-sidebar-title">
              <span class="ws-icon-side">💼</span>
              <span>{{ selectedWorkspace()?.name }}</span>
            </div>
            <ul class="settings-menu-list">
              <li [class.active]="activeSettingsTab() === 'boards'" (click)="activeSettingsTab.set('boards')">
                <span>📋</span> Boards
              </li>
              <li [class.active]="activeSettingsTab() === 'members'" (click)="activeSettingsTab.set('members')">
                <span>👥</span> Members
              </li>
              <li [class.active]="activeSettingsTab() === 'settings'" (click)="activeSettingsTab.set('settings')">
                <span>⚙️</span> Settings
              </li>
              <li [class.active]="activeSettingsTab() === 'powerups'" (click)="activeSettingsTab.set('powerups')">
                <span>🔌</span> Power-Ups <span class="badge-premium-pill">PREMIUM</span>
              </li>
              <li [class.active]="activeSettingsTab() === 'billing'" (click)="activeSettingsTab.set('billing')">
                <span>💳</span> Billing
              </li>
              <li [class.active]="activeSettingsTab() === 'export'" (click)="activeSettingsTab.set('export')">
                <span>📤</span> Export <span class="badge-premium-pill">PREMIUM</span>
              </li>
            </ul>
          </div>

          <div class="sidebar-section">
            <button class="btn btn-secondary btn-full" (click)="showCreateModal.set(true)">
              ➕ Create Workspace
            </button>
            <div class="workspaces-selector-box" *ngIf="workspaces().length > 1">
              <label class="form-label font-xs">Switch Workspace:</label>
              <select class="form-control inline-select" [ngModel]="selectedWorkspace()?.id" (ngModelChange)="onWorkspaceSwitch($event)">
                <option *ngFor="let w of workspaces()" [value]="w.id">{{ w.name }}</option>
              </select>
            </div>
          </div>
        </aside>

        <!-- Right Main Panel (Tab Content) -->
        <main class="ws-main-panel">
          <div class="alert alert-error" *ngIf="message() && !message().includes('successfully')">
            <span>⚠</span> {{ message() }}
          </div>
          <div class="alert alert-success" *ngIf="message() && message().includes('successfully')">
            <span>✔</span> {{ message() }}
          </div>

          <!-- Empty workspace selection state -->
          <div *ngIf="!selectedWorkspace()" class="card empty-state">
            <span class="empty-state-icon">💼</span>
            <h3>No workspace selected or access denied</h3>
            <p>Select or create a workspace to view its settings. If you were invited as a guest to a specific project board, please check your <a routerLink="/boards" class="text-blue">Boards dashboard</a> instead, as you don't have access to the full Workspace.</p>
            <button class="btn btn-primary btn-sm" (click)="showCreateModal.set(true)">Create Workspace</button>
          </div>

          <div *ngIf="selectedWorkspace()">
            
            <!-- BOARDS TAB -->
            <div *ngIf="activeSettingsTab() === 'boards'">
              <div class="tab-header-row">
                <h2>Boards in Workspace</h2>
                <button class="btn btn-primary btn-sm" (click)="onCreateBoardClick()">➕ Create Board</button>
              </div>

              <div *ngIf="workspaceBoards().length === 0" class="boards-empty-state">
                <p>No boards in this workspace. Create a board to start organizing lists and tasks!</p>
                <button class="btn btn-secondary btn-sm" (click)="onCreateBoardClick()">Create new board</button>
              </div>

              <div class="grid-3 home-boards-grid" *ngIf="workspaceBoards().length > 0">
                <div *ngFor="let board of workspaceBoards()" 
                     class="board-grid-card" 
                     [style.background]="getBoardBg(board.id)"
                     (click)="goToBoard(board.id)">
                  <h3>{{ board.name }}</h3>
                  <div class="board-card-actions" (click)="$event.stopPropagation()">
                    <button class="btn btn-ghost text-white btn-sm" (click)="deleteBoard(board.id)" title="Delete board">🗑</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- MEMBERS TAB (Collaborators) -->
            <div *ngIf="activeSettingsTab() === 'members'">
              <div class="tab-header-row border-bottom">
                <div class="members-title-group">
                  <h2>Collaborators ({{ members().length }})</h2>
                  <p class="tab-subtitle">Workspace members can view and join all Workspace visible boards and create new boards.</p>
                </div>
                <button class="btn btn-primary" (click)="showInviteForm.set(!showInviteForm())">
                  <span>👤</span> Invite Workspace members
                </button>
              </div>

              <!-- Inline Invite Form -->
              <div class="card invite-panel-inline animate-in" *ngIf="showInviteForm()">
                <div class="card-body">
                  <h4>➕ Invite Team Member</h4>
                  <form (ngSubmit)="inviteMember()" class="invite-member-form">
                    <div class="form-group">
                      <label class="form-label" for="inviteUser">Select User</label>
                      <select id="inviteUser" class="form-control" [(ngModel)]="newInviteEmail" name="newInviteEmail" required>
                        <option value="" disabled>-- Select a user --</option>
                        <option *ngFor="let u of availableUsersToInvite()" [value]="u.email">{{ u.username }} ({{ u.email }})</option>
                      </select>
                      <p class="hint-text" *ngIf="availableUsersToInvite().length === 0">All registered users are already members.</p>
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="inviteRole">Workspace Role</label>
                      <select id="inviteRole" class="form-control" [(ngModel)]="newInviteRole" name="newInviteRole">
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                    <div class="invite-actions-row">
                      <button class="btn btn-success" type="submit" [disabled]="!newInviteEmail">Send Invitation</button>
                      <button class="btn btn-ghost" type="button" (click)="showInviteForm.set(false)">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Filter menu -->
              <div class="members-filter-bar">
                <input type="text" class="form-control filter-input" placeholder="Filter by name" [(ngModel)]="memberFilter" name="memberFilter" />
              </div>

              <div class="sub-tabs-bar">
                <span class="sub-tab active">Members ({{ filteredMembers.length }})</span>
                <span class="sub-tab">Single-board guests (0)</span>
                <span class="sub-tab">Multi-board guests (0)</span>
                <span class="sub-tab">Join requests (0)</span>
              </div>

              <div *ngIf="filteredMembers.length === 0" class="empty-state-small">
                No matching members in this workspace.
              </div>

              <div class="members-table-card" *ngIf="filteredMembers.length > 0">
                <div class="member-table-row header-row-members">
                  <span>User</span>
                  <span>Last Active</span>
                  <span>Boards</span>
                  <span>Role</span>
                  <span>Actions</span>
                </div>
                <div *ngFor="let member of filteredMembers" class="member-table-row">
                  <div class="member-cell-user">
                    <div class="avatar avatar-sm avatar-member">
                      {{ getInitials(member.email) }}
                    </div>
                    <div class="member-cell-info">
                      <span class="member-cell-name">{{ getUserDisplayName(member.email) }}</span>
                      <span class="member-cell-handle">{{ member.email || 'Workspace Member' }}</span>
                    </div>
                  </div>
                  <div class="member-cell-active">
                    <span>Last active Jun 2026</span>
                  </div>
                  <div class="member-cell-boards">
                    <span>Boards ({{ workspaceBoards().length }})</span>
                  </div>
                  <div class="member-cell-role">
                    <select class="form-control inline-select font-xs" [(ngModel)]="member.role" (change)="updateMemberRole(member)" name="role-{{ member.id }}">
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div class="member-cell-actions">
                    <button class="btn btn-ghost btn-sm text-red" (click)="removeMember(member.id)" title="Remove Member">Leave</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SETTINGS TAB -->
            <div *ngIf="activeSettingsTab() === 'settings'">
              <div class="tab-header-row border-bottom">
                <h2>Workspace Settings</h2>
              </div>

              <!-- AI Toggle Switch (Screenshot 4) -->
              <div class="settings-premium-card">
                <div class="premium-badge-row">
                  <span class="premium-ai-sparkle">✨</span>
                  <h3>AI</h3>
                  <span class="badge-premium-pill">PREMIUM</span>
                </div>
                <div class="premium-ai-description-row">
                  <div class="premium-ai-text">
                    <p><strong>AI is activated</strong> for all boards in this Workspace.</p>
                    <p class="font-sm text-secondary">AI is an artificial intelligence tool to help generate, improve, and summarize content while writing on Trello. <a href="javascript:void(0)" class="text-blue font-weight-500">Learn About AI</a></p>
                  </div>
                  <div class="ai-toggle-switch">
                    <label class="switch-control">
                      <input type="checkbox" [ngModel]="aiEnabled()" (ngModelChange)="aiEnabled.set($event)" />
                      <span class="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Restriction rows -->
              <div class="settings-restrictions-section">
                <!-- Visibility -->
                <div class="restriction-row">
                  <div class="restriction-info">
                    <h4>Workspace visibility</h4>
                    <p>🔒 Private - This Workspace is private. It's not indexed or visible to those outside the Workspace.</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="triggerPlaceholderAction()">Change</button>
                </div>

                <!-- Membership Restrictions -->
                <div class="restriction-row">
                  <div class="restriction-info">
                    <h4>Workspace membership restrictions 🔒</h4>
                    <p>Anyone can be added to this Workspace.</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="triggerPlaceholderAction()">Change</button>
                </div>

                <!-- Board creation Restrictions -->
                <div class="restriction-row">
                  <div class="restriction-info">
                    <h4>Board creation restrictions 🔒</h4>
                    <p>Any Workspace member can create public, workspace visible, or private boards.</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="triggerPlaceholderAction()">Change</button>
                </div>

                <!-- Board deletion Restrictions -->
                <div class="restriction-row">
                  <div class="restriction-info">
                    <h4>Board deletion restrictions 🔒</h4>
                    <p>Any Workspace member can delete public or workspace visible boards.</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" (click)="triggerPlaceholderAction()">Change</button>
                </div>
              </div>

              <!-- Workspace Info Update form -->
              <hr class="divider" />
              <div class="card selected-workspace-card">
                <div class="card-header">Edit Workspace Profile Details</div>
                <div class="card-body">
                  <form (ngSubmit)="updateWorkspace()" class="workspace-edit-form">
                    <div class="form-group">
                      <label class="form-label" for="editName">Workspace Name</label>
                      <input id="editName" class="form-control" type="text" [(ngModel)]="editName" name="editName" required />
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="editDescription">Description</label>
                      <textarea id="editDescription" class="form-control" [(ngModel)]="editDescription" name="editDescription" placeholder="Optional description"></textarea>
                    </div>
                    <div class="form-group">
                      <button class="btn btn-primary" type="submit">Update Details</button>
                      <button class="btn btn-danger btn-ghost" type="button" (click)="deleteWorkspace(selectedWorkspace()!.id)" style="margin-left: 10px;">🗑 Delete Workspace</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- BILLING TAB (Screenshot 5) -->
            <div *ngIf="activeSettingsTab() === 'billing'">
              <div class="tab-header-row">
                <h2>Billing</h2>
              </div>

              <div class="billing-free-trial-banner">
                <span>💼</span>
                <p>This Workspace has a Trello Premium free trial!</p>
              </div>

              <div class="billing-columns-layout">
                <!-- Left Details features box -->
                <div class="billing-features-card">
                  <div class="features-heading-promo">
                    <span>💳</span>
                    <h3>Upgrade to capture, organize, and tackle your to-dos from anywhere</h3>
                  </div>
                  <div class="features-promo-list">
                    <div class="promo-feature-item">
                      <strong>📅 Planner</strong>
                      <p>Drag and drop cards on a calendar to block any available time. Sync with more events in your favorite tools.</p>
                    </div>
                    <div class="promo-feature-item">
                      <strong>🎨 Collapsible lists and list colors</strong>
                      <p>Collapse and expand lists. Choose different colors for each list in your board.</p>
                    </div>
                    <div class="promo-feature-item">
                      <strong>🪞 Mirror cards</strong>
                      <p>Mirror cards to view or edit from different boards.</p>
                    </div>
                    <div class="promo-feature-item">
                      <strong>✨ AI</strong>
                      <p>Let AI handle summaries, due dates, descriptions, checklists, and more.</p>
                    </div>
                    <div class="promo-feature-item">
                      <strong>⚡ Unlimited automations</strong>
                      <p>Automate your workflow with no code.</p>
                    </div>
                    <div class="promo-feature-item">
                      <strong>📋 Unlimited boards</strong>
                      <p>Organize and manage as many projects as you want in your Workspace.</p>
                    </div>
                  </div>
                  <div class="features-footer-links">
                    <a href="javascript:void(0)" class="text-blue">Contact support</a>
                    <span>·</span>
                    <a href="javascript:void(0)" class="text-blue">Learn more</a>
                  </div>
                </div>

                <!-- Right Plan Forms box -->
                <div class="billing-plan-form-card">
                  <h3>Choose plan</h3>
                  <a href="javascript:void(0)" class="compare-plans-link">Compare plans</a>

                  <div class="plans-boxes-row">
                    <div class="plan-box" [class.selected]="billingPlan() === 'standard'" (click)="billingPlan.set('standard')">
                      <h4>Trello Standard</h4>
                      <div class="plan-price">$5 <span>USD</span></div>
                      <p class="price-desc">Per user per month billed annually ($6 billed monthly)</p>
                    </div>

                    <div class="plan-box" [class.selected]="billingPlan() === 'premium'" (click)="billingPlan.set('premium')">
                      <h4>Trello Premium</h4>
                      <div class="plan-price">$10 <span>USD</span></div>
                      <p class="price-desc">Per user per month billed annually ($12.50 billed monthly)</p>
                    </div>
                  </div>

                  <!-- Credit Card payment details -->
                  <div class="payment-info-section">
                    <h3>Payment information</h3>
                    <p class="step-label">STEP 1 OF 2</p>

                    <form (ngSubmit)="handlePaymentSubmit()" class="payment-details-form">
                      <div class="form-group">
                        <label class="form-label" for="cardNumber">Card Number *</label>
                        <input id="cardNumber" class="form-control" type="text" placeholder="4111 1111 1111 1111" required />
                      </div>
                      <div class="form-grid-2">
                        <div class="form-group">
                          <label class="form-label" for="expDate">Expiration Date *</label>
                          <input id="expDate" class="form-control" type="text" placeholder="MM/YY" required />
                        </div>
                        <div class="form-group">
                          <label class="form-label" for="cvv">CVV * <span>❔</span></label>
                          <input id="cvv" class="form-control" type="text" placeholder="3 digits" required />
                        </div>
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="country">Country *</label>
                        <select id="country" class="form-control">
                          <option>United States</option>
                          <option>United Kingdom</option>
                          <option>Canada</option>
                          <option>Australia</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label" for="zipCode">ZIP/Postal Code *</label>
                        <input id="zipCode" class="form-control" type="text" placeholder="90210" required />
                      </div>

                      <div class="billing-summary-section">
                        <h3>Billing summary</h3>
                        <div class="billing-cycle-switch">
                          <label class="form-label">Billing cycle:</label>
                          <div class="cycle-toggles">
                            <span class="cycle-toggle" [class.active]="billingCycle() === 'monthly'" (click)="billingCycle.set('monthly')">Monthly</span>
                            <span class="cycle-toggle" [class.active]="billingCycle() === 'annually'" (click)="billingCycle.set('annually')">Annually</span>
                          </div>
                        </div>
                      </div>

                      <button class="btn btn-primary btn-full" type="submit">Upgrade Plan</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <!-- OTHER STUB TABS (POWERUPS, EXPORT, PROFILE, ACTIVITY, CARDS, PERSONAL SETTINGS, LABS) -->
            <div *ngIf="activeSettingsTab() === 'powerups' || activeSettingsTab() === 'export'">
              <div class="tab-header-row">
                <h2>{{ activeSettingsTab() === 'powerups' ? 'Power-Ups' : 'Export' }}</h2>
                <span class="badge badge-purple">Premium Feature</span>
              </div>
              <div class="card empty-state">
                <span class="empty-state-icon">🔌</span>
                <h3>Premium Feature Trial</h3>
                <p>Integrations, automation dashboards, and raw boards export are available under your Premium free trial.</p>
                <button class="btn btn-primary btn-sm" (click)="activeSettingsTab.set('billing')">Manage Billing</button>
              </div>
            </div>

            <div *ngIf="activeSettingsTab() === 'profile'">
              <div class="tab-header-row">
                <h2>Profile and Visibility</h2>
              </div>
              <div class="card info-panel">
                <div class="card-body">
                  <p><strong>DisplayName:</strong> {{ auth.displayName() }}</p>
                  <p><strong>Email Address:</strong> {{ auth.user()?.email }}</p>
                  <p><strong>Status:</strong> Active</p>
                </div>
              </div>
            </div>

            <div *ngIf="activeSettingsTab() === 'activity'">
              <div class="tab-header-row">
                <h2>Activity Logs</h2>
              </div>
              <button class="btn btn-secondary" (click)="goToActivityLogs()">View Full Activity Timeline</button>
            </div>

            <div *ngIf="activeSettingsTab() === 'cards'">
              <div class="tab-header-row">
                <h2>Task Cards</h2>
              </div>
              <button class="btn btn-secondary" (click)="goToCards()">View Task Cards List</button>
            </div>

            <div *ngIf="activeSettingsTab() === 'personal-settings' || activeSettingsTab() === 'labs'">
              <div class="tab-header-row">
                <h2>Settings & Labs</h2>
              </div>
              <p class="text-secondary">Explore experimental features and configurations for your profile layout.</p>
            </div>

          </div>

        </main>
      </div>

      <!-- Create Workspace Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal()">
        <div class="modal animate-in">
          <div class="modal-header">
            <span class="modal-title">Create New Workspace</span>
            <button class="btn-icon" (click)="showCreateModal.set(false)">✕</button>
          </div>
          <form (ngSubmit)="createWorkspaceSubmit()">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 14px;">
                <label class="form-label" for="newName">Workspace Name</label>
                <input id="newName" class="form-control" type="text" [(ngModel)]="newName" name="newName" placeholder="e.g. Marketing Team" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="newDescription">Description</label>
                <textarea id="newDescription" class="form-control" [(ngModel)]="newDescription" name="newDescription" placeholder="What does this workspace do?"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" (click)="showCreateModal.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit" [disabled]="!newName.trim()">Create Workspace</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-page-root {
      background: #fafbfc;
      min-height: calc(100vh - 48px);
      padding: 0;
    }

    /* Workspace active header bar */
    .ws-header-nav {
      background: #ffffff;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #dfe1e6;
    }
    .ws-header-logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #0052cc 0%, #6554c0 100%);
      color: #ffffff;
      font-size: 2rem;
      font-weight: 800;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ws-header-desc {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ws-header-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ws-header-title-row h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #172b4d;
      font-weight: 700;
    }
    .edit-icon-ws {
      cursor: pointer;
      font-size: 0.85rem;
      opacity: 0.6;
    }
    .edit-icon-ws:hover {
      opacity: 1;
    }
    .ws-header-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }

    /* Columns layout */
    .workspace-main-container {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: calc(100vh - 156px);
    }
    @media (max-width: 768px) {
      .workspace-main-container {
        grid-template-columns: 1fr;
      }
      .ws-settings-sidebar {
        border-right: none;
        border-bottom: 1px solid #dfe1e6;
      }
    }

    /* Left settings sidebar */
    .ws-settings-sidebar {
      background: #ffffff;
      border-right: 1px solid #dfe1e6;
      padding: 20px 8px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .sidebar-section h4 {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #5e6c84;
      padding: 0 12px;
      margin-bottom: 8px;
    }
    .ws-sidebar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #172b4d;
      margin-bottom: 8px;
    }
    .ws-icon-side {
      font-size: 1.1rem;
    }
    .settings-menu-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .settings-menu-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      font-size: 0.875rem;
      color: #42526e;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .settings-menu-list li:hover {
      background: rgba(9, 30, 66, 0.08);
      color: #172b4d;
    }
    .settings-menu-list li.active {
      background: #e6fcff;
      color: #008da6;
      font-weight: 600;
    }
    .badge-premium-pill {
      background: #f4f0ff;
      color: #6554c0;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: auto;
    }
    .workspaces-selector-box {
      margin-top: 14px;
      padding: 0 12px;
    }

    /* Right Main Panel */
    .ws-main-panel {
      padding: 32px 40px;
      background: #fafbfc;
      overflow-y: auto;
    }

    .tab-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .tab-header-row h2 {
      font-size: 1.2rem;
      color: #172b4d;
      margin: 0;
      font-weight: 700;
    }
    .tab-subtitle {
      font-size: 0.85rem;
      color: #5e6c84;
      margin: 4px 0 0 0;
    }
    .border-bottom {
      border-bottom: 1px solid #dfe1e6;
      padding-bottom: 16px;
    }

    /* Boards view */
    .boards-empty-state {
      padding: 32px;
      background: #ffffff;
      border: 1px dashed #dfe1e6;
      border-radius: 6px;
      text-align: center;
      color: #5e6c84;
    }
    .home-boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .board-grid-card {
      height: 100px;
      border-radius: 3px;
      padding: 12px;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: filter 0.15s;
    }
    .board-grid-card:hover {
      filter: brightness(0.9);
    }
    .board-grid-card h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }

    /* Collaborators/Members tab view */
    .invite-panel-inline {
      margin-bottom: 24px;
      border: 1px dashed #0052cc;
      background: #f0f4ff;
    }
    .invite-panel-inline h4 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 0.95rem;
      color: #0052cc;
    }
    .invite-actions-row {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }
    .hint-text {
      font-size: 0.78rem;
      color: #5e6c84;
      margin-top: 4px;
      font-style: italic;
    }
    .members-filter-bar {
      margin-bottom: 16px;
      max-width: 320px;
    }
    .sub-tabs-bar {
      display: flex;
      gap: 16px;
      border-bottom: 1px solid #dfe1e6;
      margin-bottom: 20px;
    }
    .sub-tab {
      font-size: 0.875rem;
      font-weight: 500;
      color: #5e6c84;
      padding: 8px 4px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .sub-tab.active {
      color: #0052cc;
      border-bottom-color: #0052cc;
      font-weight: 700;
    }

    /* Members Table Card (Screenshot 2) */
    .members-table-card {
      background: #ffffff;
      border: 1px solid #dfe1e6;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .member-table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 100px;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f4f5f7;
      font-size: 0.85rem;
      color: #172b4d;
    }
    .member-table-row:last-child {
      border-bottom: none;
    }
    .header-row-members {
      background: #fafbfc;
      font-weight: 700;
      color: #5e6c84;
      border-bottom: 2px solid #dfe1e6;
    }
    .member-cell-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .member-cell-info {
      display: flex;
      flex-direction: column;
    }
    .member-cell-name {
      font-weight: 600;
      color: #172b4d;
    }
    .member-cell-handle {
      font-size: 0.75rem;
      color: #5e6c84;
    }
    .avatar-member {
      background: #6554c0;
      color: white;
    }

    /* Settings Tab elements (Screenshot 4) */
    .settings-premium-card {
      background: #f4f0ff;
      border: 1px solid #dcd2f9;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .premium-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .premium-badge-row h3 {
      margin: 0;
      font-size: 1.05rem;
      color: #6554c0;
    }
    .premium-ai-sparkle {
      font-size: 1.2rem;
    }
    .premium-ai-description-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .premium-ai-text p {
      margin: 0 0 6px 0;
      color: #172b4d;
      font-size: 0.9rem;
    }
    .premium-ai-text p:last-child {
      margin-bottom: 0;
    }

    /* Toggle Switch styles */
    .switch-control {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch-control input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #ccc;
      transition: .2s;
      border-radius: 24px;
    }
    .switch-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }
    input:checked + .switch-slider {
      background-color: #36b37e;
    }
    input:checked + .switch-slider:before {
      transform: translateX(20px);
    }

    /* Settings restriction lists */
    .settings-restrictions-section {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: #dfe1e6;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .restriction-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #ffffff;
    }
    .restriction-info h4 {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #172b4d;
      font-weight: 600;
    }
    .restriction-info p {
      margin: 0;
      font-size: 0.8rem;
      color: #5e6c84;
    }

    /* Billing tab elements (Screenshot 5) */
    .billing-free-trial-banner {
      background: #e3fcef;
      border: 1px solid #abf5d1;
      color: #1d7f54;
      border-radius: 4px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .billing-free-trial-banner p {
      margin: 0;
    }
    .billing-columns-layout {
      display: grid;
      grid-template-columns: 1.1fr 1.3fr;
      gap: 32px;
    }
    @media (max-width: 990px) {
      .billing-columns-layout {
        grid-template-columns: 1fr;
      }
    }

    .billing-features-card {
      background: #ffffff;
      border: 1px solid #dfe1e6;
      border-radius: 4px;
      padding: 24px;
      height: fit-content;
    }
    .features-heading-promo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .features-heading-promo h3 {
      font-size: 1rem;
      color: #172b4d;
      margin: 0;
      font-weight: 700;
      line-height: 1.4;
    }
    .features-promo-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .promo-feature-item strong {
      font-size: 0.85rem;
      color: #172b4d;
      display: block;
      margin-bottom: 4px;
    }
    .promo-feature-item p {
      margin: 0;
      font-size: 0.8rem;
      color: #5e6c84;
      line-height: 1.4;
    }
    .features-footer-links {
      display: flex;
      gap: 8px;
      margin-top: 24px;
      font-size: 0.8rem;
      color: #5e6c84;
    }

    .billing-plan-form-card {
      background: #ffffff;
      border: 1px solid #dfe1e6;
      border-radius: 4px;
      padding: 24px;
    }
    .billing-plan-form-card h3 {
      font-size: 1rem;
      color: #172b4d;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 6px;
      display: inline-block;
    }
    .compare-plans-link {
      float: right;
      font-size: 0.8rem;
      color: #0052cc;
      text-decoration: none;
      font-weight: 500;
    }

    .plans-boxes-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 14px;
      margin-bottom: 24px;
    }
    .plan-box {
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .plan-box.selected {
      border-color: #0052cc;
      box-shadow: 0 0 0 1px #0052cc;
    }
    .plan-box h4 {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      color: #172b4d;
      font-weight: 700;
    }
    .plan-price {
      font-size: 1.5rem;
      font-weight: 800;
      color: #172b4d;
      margin-bottom: 6px;
    }
    .plan-price span {
      font-size: 0.8rem;
      font-weight: 600;
      color: #5e6c84;
    }
    .price-desc {
      margin: 0;
      font-size: 0.72rem;
      color: #5e6c84;
      line-height: 1.3;
    }

    .payment-info-section {
      border-top: 1px solid #dfe1e6;
      padding-top: 20px;
    }
    .step-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #5e6c84;
      margin: 0 0 14px 0;
    }
    .payment-details-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .billing-summary-section {
      border-top: 1px solid #dfe1e6;
      padding-top: 16px;
      margin-top: 8px;
      margin-bottom: 12px;
    }
    .billing-cycle-switch {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cycle-toggles {
      display: flex;
      border: 1px solid #dfe1e6;
      border-radius: 4px;
      overflow: hidden;
    }
    .cycle-toggle {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
      background: #fafbfc;
      color: #5e6c84;
    }
    .cycle-toggle.active {
      background: #0052cc;
      color: #ffffff;
    }
  `]
})
export class WorkspacesComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private boardService = inject(BoardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public auth = inject(AuthService);

  // Lists
  workspaces = signal<Workspace[]>([]);
  selectedWorkspace = signal<Workspace | null>(null);
  workspaceBoards = signal<Board[]>([]);
  members = signal<WorkspaceMember[]>([]);
  registeredUsers = signal<AuthUser[]>([]);
  boardMembersMap = signal<Record<string, BoardMember[]>>({});

  // Navigation states
  activeSettingsTab = signal<'boards' | 'members' | 'settings' | 'billing' | 'powerups' | 'export' | 'profile' | 'activity' | 'cards' | 'personal-settings' | 'labs'>('boards');
  activeMembersSubTab = signal<'members' | 'single-guest' | 'multi-guest' | 'join-requests'>('members');
  showInviteForm = signal(false);
  showCreateModal = signal(false);

  // Forms
  newName = '';
  newDescription = '';
  editName = '';
  editDescription = '';
  newInviteEmail = '';
  newInviteRole = 'Member';
  memberFilter = '';

  // Settings mock toggles
  aiEnabled = signal(true);
  billingPlan = signal<'standard' | 'premium'>('premium');
  billingCycle = signal<'monthly' | 'annually'>('annually');

  // Messaging
  message = signal('');

  private bgGradients = [
    'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
    'linear-gradient(135deg, #6554c0 0%, #403294 100%)',
    'linear-gradient(135deg, #00b8d9 0%, #008da6 100%)',
    'linear-gradient(135deg, #36b37e 0%, #1d7f54 100%)',
    'linear-gradient(135deg, #ffab00 0%, #ff8b00 100%)',
    'linear-gradient(135deg, #de350b 0%, #bf2600 100%)'
  ];

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.loadUsers();
      this.loadWorkspaces().then(() => {
        // Also honor ?tab= param passed from dashboard sidebar
        const tabParam = this.route.snapshot.queryParamMap.get('tab');
        if (tabParam) {
          const validTabs = ['boards', 'members', 'settings', 'billing', 'powerups', 'export', 'profile', 'activity', 'cards', 'personal-settings', 'labs'] as const;
          type ValidTab = typeof validTabs[number];
          if ((validTabs as readonly string[]).includes(tabParam)) {
            this.activeSettingsTab.set(tabParam as ValidTab);
          }
        }
      });
    }
  }

  async loadUsers() {
    try {
      const users = await this.auth.fetchUsers();
      this.registeredUsers.set(users);
    } catch {}
  }

  async loadWorkspaces() {
    this.message.set('');
    try {
      const list = await this.workspaceService.getWorkspaces();
      this.workspaces.set(list);
      if (list.length > 0) {
        // Honor ?workspaceId= query param if present, else default to first
        const requestedId = this.route.snapshot.queryParamMap.get('workspaceId');
        const target = requestedId
          ? list.find(w => w.id === requestedId) ?? list[0]
          : list[0];
        if (!this.selectedWorkspace() || this.selectedWorkspace()!.id !== target.id) {
          this.selectWorkspace(target);
        }
      }
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }


  async selectWorkspace(workspace: Workspace) {
    this.selectedWorkspace.set(workspace);
    this.editName = workspace.name;
    this.editDescription = workspace.description ?? '';
    await this.loadWorkspaceBoards(workspace.id);
    await this.loadMembers(workspace.id);
    await this.loadAllBoardsMembers(workspace.id);
  }

  async loadAllBoardsMembers(workspaceId: string) {
    const boards = this.workspaceBoards();
    const map: Record<string, BoardMember[]> = {};
    try {
      await Promise.all(
        boards.map(async (board) => {
          const members = await this.boardService.getBoardMembers(board.id);
          map[board.id] = members;
        })
      );
      this.boardMembersMap.set(map);
    } catch {}
  }

  async loadWorkspaceBoards(workspaceId: string) {
    try {
      const allBoards = await this.boardService.getBoards();
      this.workspaceBoards.set(allBoards.filter(b => b.workspaceId === workspaceId));
    } catch {}
  }

  async loadMembers(workspaceId?: string) {
    const wsId = workspaceId || this.selectedWorkspace()?.id;
    if (!wsId) return;

    try {
      const list = await this.workspaceService.getWorkspaceMembers(wsId);
      this.members.set(list);
    } catch {}
  }

  onWorkspaceSwitch(workspaceId: string) {
    const ws = this.workspaces().find(w => w.id === workspaceId);
    if (ws) {
      this.selectWorkspace(ws);
      // Update the URL so it reflects the selected workspace
      this.router.navigate([], {
        queryParams: { workspaceId: ws.id },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  get filteredMembers(): WorkspaceMember[] {
    const query = this.memberFilter.trim().toLowerCase();
    let all = this.members();
    // Also include the workspace owner if not already in members list
    const ws = this.selectedWorkspace();
    if (ws && ws.ownerId) {
      const ownerInList = all.some(m => m.userId === ws.ownerId);
      if (!ownerInList) {
        const ownerUser = this.registeredUsers().find(u => u.id === ws.ownerId);
        const syntheticOwner: WorkspaceMember = {
          id: 'owner-' + ws.ownerId,
          workspaceId: ws.id,
          userId: ws.ownerId,
          email: ownerUser?.email,
          role: 'Admin'
        };
        all = [syntheticOwner, ...all];
      }
    }
    if (!query) return all;
    return all.filter(m => 
      m.email?.toLowerCase().includes(query) || m.userId.toLowerCase().includes(query)
    );
  }

  get availableUsersToInvite(): (() => Array<{email: string; username: string}>) {
    return () => {
      const memberEmails = new Set(this.members().map(m => m.email?.toLowerCase()));
      const ws = this.selectedWorkspace();
      const ownerEmail = ws ? this.registeredUsers().find(u => u.id === ws.ownerId)?.email?.toLowerCase() : undefined;
      if (ownerEmail) memberEmails.add(ownerEmail);
      // Exclude current user too
      const currentEmail = this.auth.user()?.email?.toLowerCase();
      if (currentEmail) memberEmails.add(currentEmail);
      return this.registeredUsers()
        .filter(u => !memberEmails.has(u.email.toLowerCase()))
        .map(u => ({
          email: u.email,
          username: u.email.split('@')[0]
        }));
    };
  }

  getUserDisplayName(email?: string): string {
    if (!email) return 'Unknown Member';
    return email.split('@')[0];
  }

  getInitials(email?: string): string {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  goToBoard(boardId: string) {
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

  onCreateBoardClick() {
    this.router.navigate(['/boards']);
  }

  async createWorkspaceSubmit() {
    this.message.set('');
    if (!this.newName.trim()) return;

    try {
      const workspace = await this.workspaceService.createWorkspace({
        name: this.newName.trim(),
        description: this.newDescription.trim() || undefined,
        ownerId: '00000000-0000-0000-0000-000000000000'
      });

      this.workspaces.update((list) => [...list, workspace]);
      this.newName = '';
      this.newDescription = '';
      this.showCreateModal.set(false);
      this.selectWorkspace(workspace);
      this.message.set('Workspace created successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async updateWorkspace() {
    const workspace = this.selectedWorkspace();
    if (!workspace) return;

    this.message.set('');
    try {
      const updated = await this.workspaceService.updateWorkspace(workspace.id, {
        name: this.editName.trim(),
        description: this.editDescription.trim() || undefined
      });
      this.selectedWorkspace.set(updated);
      this.workspaces.update((list) => list.map((item) => item.id === updated.id ? updated : item));
      this.message.set('Workspace updated successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async deleteWorkspace(workspaceId: string) {
    if (!confirm('Delete this workspace?')) return;

    this.message.set('');
    try {
      await this.workspaceService.deleteWorkspace(workspaceId);
      const list = this.workspaces().filter((item) => item.id !== workspaceId);
      this.workspaces.set(list);
      if (this.selectedWorkspace()?.id === workspaceId) {
        if (list.length > 0) {
          this.selectWorkspace(list[0]);
        } else {
          this.selectedWorkspace.set(null);
          this.workspaceBoards.set([]);
          this.members.set([]);
        }
      }
      this.message.set('Workspace deleted successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async inviteMember() {
    const workspace = this.selectedWorkspace();
    if (!workspace) return;

    if (!this.newInviteEmail.trim()) return;

    this.message.set('');
    try {
      const invited = await this.workspaceService.inviteMember({
        workspaceId: workspace.id,
        email: this.newInviteEmail.trim().toLowerCase(),
        role: this.newInviteRole
      });
      this.members.update((list) => [...list, invited]);
      this.newInviteEmail = '';
      this.newInviteRole = 'Member';
      this.showInviteForm.set(false);
      this.message.set('Member invited successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async updateMemberRole(member: WorkspaceMember) {
    if (!member.id || !member.role) return;

    this.message.set('');
    try {
      await this.workspaceService.updateMemberRole(member.id, { role: member.role });
      this.message.set('Member role updated successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async removeMember(memberId: string) {
    if (!confirm('Remove this member?')) return;

    this.message.set('');
    try {
      await this.workspaceService.removeMember(memberId);
      this.members.update((list) => list.filter((m) => m.id !== memberId));
      this.message.set('Member removed successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async deleteBoard(boardId: string) {
    if (!confirm('Delete this board?')) return;

    this.message.set('');
    try {
      await this.boardService.deleteBoard(boardId);
      this.workspaceBoards.update(list => list.filter(b => b.id !== boardId));
      this.message.set('Board deleted successfully.');
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  triggerPlaceholderAction() {
    alert('This administrative workspace setting action is mock-configured for this premium workspace.');
  }

  handlePaymentSubmit() {
    this.message.set('Upgrade processing simulation complete. Plan upgraded successfully!');
    alert('Thank you! Your payment details are processed under the Premium Trial.');
  }

  goToActivityLogs() {
    this.router.navigate(['/activity-logs']);
  }

  goToCards() {
    this.router.navigate(['/cards']);
  }
}


