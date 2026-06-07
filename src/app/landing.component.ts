import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page animate-in">
      <header class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Trello brings all your tasks, teammates, and tools together</h1>
          <p class="hero-subtitle">Keep everything in the same place—even if your team isn’t.</p>
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary btn-lg">Sign up - it's free!</a>
            <a routerLink="/login" class="btn btn-ghost btn-lg">Log in</a>
          </div>
        </div>
      </header>

      <section class="features-section">
        <div class="container">
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon bg-blue">📋</div>
              <h3>Boards</h3>
              <p>Trello boards keep tasks organized and work moving forward. In a glance, see everything from "things to do" to "aww yeah, we did it!"</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon bg-green">📄</div>
              <h3>Lists & Cards</h3>
              <p>The different stages of a task. Start as simple as To Do, Doing or Done—or build a workflow custom fit to your team's needs. There's no wrong way to Trello.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon bg-purple">👥</div>
              <h3>Collaborate</h3>
              <p>Leave comments, add attachments, and assign tasks directly to teammates. No matter where you are, your team stays connected.</p>
            </div>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="container text-center">
          <p>&copy; {{ currentYear }} Trello Clone App. Built for professional task management.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
      background: #fafbfc;
    }
    .hero-section {
      background: linear-gradient(135deg, #0052cc 0%, #0747a6 50%, #172b4d 100%);
      padding: 100px 20px;
      text-align: center;
      color: white;
      clip-path: polygon(0 0, 100% 0, 100% 90%, 0% 100%);
      padding-bottom: 140px;
    }
    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }
    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    .hero-subtitle {
      font-size: 1.5rem;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    .btn-lg {
      padding: 14px 32px;
      font-size: 1.1rem;
      border-radius: 8px;
    }
    .btn-ghost {
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,0.1);
    }
    .features-section {
      padding: 60px 20px 80px;
      margin-top: -60px;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
    }
    .feature-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(9, 30, 66, 0.08);
      border: 1px solid #dfe1e6;
      transition: transform 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-5px);
    }
    .feature-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 24px;
    }
    .bg-blue { background: #e6f0ff; color: #0052cc; }
    .bg-green { background: #e3fcef; color: #006644; }
    .bg-purple { background: #eaeaef; color: #403294; }
    .feature-card h3 {
      font-size: 1.5rem;
      color: #172b4d;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .feature-card p {
      color: #5e6c84;
      line-height: 1.6;
      font-size: 1.05rem;
    }
    .landing-footer {
      margin-top: auto;
      padding: 40px 20px;
      background: #172b4d;
      color: #8993a4;
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .hero-subtitle { font-size: 1.2rem; }
    }
  `]
})
export class LandingComponent {
  currentYear = new Date().getFullYear();
}
