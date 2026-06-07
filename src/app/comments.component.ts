import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { CommentService } from './comment.service';
import { CommentItem } from './comment.types';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-in" style="max-width: 720px;">
      <div class="page-header">
        <div>
          <h1 class="page-title">💬 Card Task Comments</h1>
          <p class="page-subtitle">Add comments or view feedback conversation history for card task <code>{{ cardId }}</code>.</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">Post New Comment</div>
        <div class="card-body">
          <form (submit)="createComment($event)" class="comment-post-form">
            <div class="form-group">
              <label class="form-label" for="commentText">Comment Text</label>
              <textarea id="commentText" class="form-control" [(ngModel)]="newComment" name="commentText" placeholder="Write feedback..." rows="3" required></textarea>
            </div>
            <button class="btn btn-primary" type="submit">Post Comment</button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Comments Conversation Timeline</div>
        <div class="card-body" style="padding: 0;">
          <div *ngIf="comments().length === 0" class="empty-state">
            <span class="empty-state-icon">💬</span>
            <h3>No comments posted</h3>
            <p>Share your ideas or updates by posting a comment above.</p>
          </div>

          <div class="comments-list" *ngIf="comments().length > 0">
            <div *ngFor="let comment of comments()" class="comment-row-item">
              <div class="comment-avatar">
                {{ comment.userId.substring(0, 2).toUpperCase() }}
              </div>
              <div class="comment-body-wrapper">
                <div class="comment-header">
                  <span class="comment-author">User: {{ comment.userId }}</span>
                  <span class="comment-time">{{ comment.createdAt | date:'medium' }}</span>
                </div>
                <p class="comment-text">{{ comment.commentText }}</p>
                <div class="comment-footer-actions">
                  <button class="btn btn-ghost btn-sm btn-icon-only text-danger" (click)="removeComment(comment.id)" title="Delete Comment">🗑 Remove</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comment-post-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .comments-list {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .comment-row-item {
      display: flex;
      gap: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-light);
    }
    .comment-row-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .comment-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: var(--brand-purple);
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .comment-body-wrapper {
      flex: 1;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .comment-author {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: monospace;
    }
    .comment-time {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .comment-text {
      font-size: 0.92rem;
      color: var(--text-primary);
      margin: 0 0 6px 0;
      line-height: 1.4;
    }
    .comment-footer-actions {
      display: flex;
      justify-content: flex-end;
    }
    .text-danger {
      color: var(--accent-red);
    }
  `]
})
export class CommentsComponent implements OnInit {
  comments = signal<CommentItem[]>([]);
  newComment = '';
  cardId = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private commentService: CommentService
  ) {}

  ngOnInit() {
    this.cardId = this.route.snapshot.paramMap.get('cardId') || '';
    this.loadComments();
  }

  async loadComments() {
    if (!this.cardId) return;
    const items = await this.commentService.getComments(this.cardId);
    this.comments.set(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }

  async createComment(event: Event) {
    event.preventDefault();
    if (!this.newComment.trim() || !this.cardId) return;
    const userId = this.auth.userId() || '00000000-0000-0000-0000-000000000000';
    await this.commentService.createComment({
      cardId: this.cardId,
      userId,
      commentText: this.newComment.trim()
    });
    this.newComment = '';
    await this.loadComments();
  }

  async removeComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    await this.commentService.deleteComment(commentId);
    await this.loadComments();
  }
}

