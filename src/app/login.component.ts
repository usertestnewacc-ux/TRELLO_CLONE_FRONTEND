import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card animate-in">
        <div class="auth-logo">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="9" height="16" rx="2" fill="white"/>
              <rect x="17" y="2" width="9" height="11" rx="2" fill="white"/>
            </svg>
          </div>
          <span class="logo-text">Trello</span>
        </div>

        <h1 class="auth-title">Log in to Trello</h1>
        <p class="auth-subtitle">Enter your credentials to continue</p>

        <div class="alert alert-error" *ngIf="error()">
          <span>⚠</span> {{ error() }}
        </div>

        <form (ngSubmit)="submit()" class="auth-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              class="form-control"
              type="email"
              name="email"
              [(ngModel)]="email"
              placeholder="Enter your email"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-wrap">
              <input
                id="password"
                class="form-control"
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                {{ showPassword() ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button class="btn btn-primary btn-full btn-lg auth-submit" type="submit" [disabled]="loading()">
            <span class="spinner" *ngIf="loading()"></span>
            <span *ngIf="!loading()">Log in</span>
          </button>
        </form>

        <div class="auth-divider"><span>or</span></div>

        <div class="auth-footer">
          Don't have an account?
          <a routerLink="/register" class="auth-link">Sign up for free</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 56px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0052cc 0%, #0747a6 50%, #172b4d 100%);
      padding: 24px 16px;
    }
    .auth-card {
      background: white;
      border-radius: 16px;
      padding: 40px 36px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo-icon {
      width: 44px; height: 44px;
      background: #0052cc;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-text {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0052cc;
      letter-spacing: -0.03em;
    }
    .auth-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #172b4d;
      text-align: center;
      margin-bottom: 6px;
    }
    .auth-subtitle {
      font-size: 0.875rem;
      color: #5e6c84;
      text-align: center;
      margin-bottom: 24px;
    }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .password-wrap { position: relative; }
    .password-wrap .form-control { padding-right: 44px; }
    .toggle-pw {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      font-size: 1rem; color: #5e6c84;
      padding: 4px;
    }
    .auth-submit { margin-top: 8px; font-size: 1rem; height: 48px; }
    .auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 20px 0; color: #97a0af; font-size: 0.8rem;
    }
    .auth-divider::before, .auth-divider::after {
      content: ''; flex: 1; height: 1px; background: #dfe1e6;
    }
    .auth-footer { text-align: center; font-size: 0.875rem; color: #5e6c84; }
    .auth-link { color: #0052cc; font-weight: 600; }
    .auth-link:hover { text-decoration: underline; }
    .demo-hint {
      margin-top: 16px;
      padding: 10px 14px;
      background: #f4f5f7;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #5e6c84;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPassword = signal(false);

  constructor(private auth: AuthService, private router: Router) { }

  async submit() {
    if (!this.email.trim() || !this.password) return;
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email.trim(), this.password);
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set(err?.error?.error ?? err?.message ?? 'Login failed. Check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
