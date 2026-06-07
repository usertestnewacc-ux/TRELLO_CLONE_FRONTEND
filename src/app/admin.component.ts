import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙ Admin Role Management</h1>
          <p class="page-subtitle">Assign system-wide administrative and member access roles to registered users.</p>
        </div>
        <div>
          <button class="btn btn-primary btn-sm" (click)="loadUsers()">
            <span>🔄</span> Reload Users
          </button>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="message() && !message().includes('successfully')">
        <span>⚠</span> {{ message() }}
      </div>
      <div class="alert alert-success" *ngIf="message() && message().includes('successfully')">
        <span>✔</span> {{ message() }}
      </div>

      <div *ngIf="auth.role() !== 'Admin'" class="card empty-state">
        <span class="empty-state-icon">🔐</span>
        <h3>Access Restricted</h3>
        <p>You must have the Administrator role to access this control panel.</p>
      </div>

      <div *ngIf="auth.role() === 'Admin'" class="grid-2" style="align-items: start; gap: 24px;">
        <!-- User table list -->
        <div class="card">
          <div class="card-header">Registered System Users</div>
          <div class="card-body" style="padding: 0;">
            <div *ngIf="users().length === 0" class="empty-state">
              <h3>No users found</h3>
            </div>
            
            <div class="table-container" *ngIf="users().length > 0">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th>Current Roles</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of users()">
                    <td class="user-email-cell">{{ user.email }}</td>
                    <td>
                      <span *ngFor="let r of user.roles" class="badge" 
                            [class.badge-blue]="r === 'Admin'" 
                            [class.badge-gray]="r !== 'Admin'">
                        {{ r }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Role update form -->
        <div class="card" *ngIf="users().length > 0">
          <div class="card-header">Update User Role</div>
          <div class="card-body">
            <form (ngSubmit)="submitRole()" class="admin-form">
              <div class="form-group">
                <label class="form-label" for="selectedEmail">Select User Email</label>
                <select id="selectedEmail" class="form-control" name="selectedEmail" [(ngModel)]="selectedEmail" required>
                  <option value="" disabled>-- Select User --</option>
                  <option *ngFor="let user of users()" [value]="user.email">{{ user.email }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="selectedRole">System Role</label>
                <select id="selectedRole" class="form-control" name="selectedRole" [(ngModel)]="selectedRole">
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button class="btn btn-primary btn-full" style="margin-top: 10px;" type="submit">
                Update System Role
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .admin-table th, .admin-table td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-light);
    }
    .admin-table th {
      background: var(--bg-primary);
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    .admin-table tbody tr:hover {
      background: #fdfdfd;
    }
    .user-email-cell {
      font-weight: 600;
      color: var(--text-primary);
    }
    .admin-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class AdminComponent implements OnInit {
  users = signal<Array<{ email: string; roles: string[] }>>([]);
  message = signal('');
  selectedEmail = '';
  selectedRole = 'Member';

  constructor(public auth: AuthService) {}

  ngOnInit() {
    if (this.auth.role() === 'Admin') {
      void this.loadUsers();
    }
  }

  async loadUsers() {
    this.message.set('');
    try {
      const loaded = await this.auth.fetchUsers();
      this.users.set(loaded);
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }

  async submitRole() {
    if (!this.selectedEmail) {
      this.message.set('Please choose a user.');
      return;
    }

    try {
      await this.auth.updateUserRole(this.selectedEmail, this.selectedRole);
      this.message.set('Role updated successfully.');
      await this.loadUsers();
    } catch (error) {
      this.message.set((error as Error).message);
    }
  }
}

