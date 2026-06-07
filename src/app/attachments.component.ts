import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AttachmentService } from './attachment.service';
import { AttachmentItem } from './attachment.types';

@Component({
  selector: 'app-attachments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container animate-in" style="max-width: 720px;">
      <div class="page-header">
        <div>
          <h1 class="page-title">📎 Card Task Attachments</h1>
          <p class="page-subtitle">Upload files, view documentation, or download attachments associated with card task <code>{{ cardId }}</code>.</p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">Upload Attachment File</div>
        <div class="card-body">
          <form (submit)="upload($event)" class="attachment-upload-form">
            <div class="form-group">
              <label class="form-label" for="file">Choose Document/Image File</label>
              <input id="file" class="form-control" type="file" (change)="selectFile($event)" required />
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="!selectedFile">
              Upload Attachment File
            </button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Uploaded Document Assets</div>
        <div class="card-body" style="padding: 0;">
          <div *ngIf="attachments().length === 0" class="empty-state">
            <span class="empty-state-icon">📎</span>
            <h3>No attachment files uploaded</h3>
            <p>Upload documentation, photos, or project briefs using the upload box above.</p>
          </div>

          <div class="attachments-list" *ngIf="attachments().length > 0" style="padding: 20px;">
            <div *ngFor="let att of attachments()" class="attachment-row-item">
              <div class="attachment-info-block">
                <span class="attachment-icon">📄</span>
                <div>
                  <a [href]="'http://localhost:5108' + att.filePath" target="_blank" class="attachment-name-link">{{ att.fileName }}</a>
                  <span class="attachment-meta-date">Uploaded on: {{ att.uploadedAt | date:'medium' }}</span>
                </div>
              </div>
              <div class="attachment-actions-block">
                <a [href]="'http://localhost:5108' + att.filePath" target="_blank" class="btn btn-secondary btn-sm">Download</a>
                <button class="btn btn-danger btn-sm btn-icon-only" (click)="deleteAttachment(att.id)" title="Remove File">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attachment-upload-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .attachment-row-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      gap: 10px;
    }
    .attachment-info-block {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .attachment-icon {
      font-size: 1.5rem;
    }
    .attachment-name-link {
      font-weight: 700;
      color: var(--text-link);
      font-size: 0.92rem;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .attachment-name-link:hover {
      text-decoration: underline;
    }
    .attachment-meta-date {
      font-size: 0.72rem;
      color: var(--text-muted);
      display: block;
      margin-top: 2px;
    }
    .attachment-actions-block {
      display: flex;
      gap: 6px;
    }
  `]
})
export class AttachmentsComponent implements OnInit {
  attachments = signal<AttachmentItem[]>([]);
  selectedFile: File | null = null;
  cardId = '';

  constructor(private route: ActivatedRoute, private attachmentService: AttachmentService) {}

  ngOnInit() {
    this.cardId = this.route.snapshot.paramMap.get('cardId') || '';
    this.loadAttachments();
  }

  async loadAttachments() {
    if (!this.cardId) return;
    const items = await this.attachmentService.getAttachments(this.cardId);
    this.attachments.set(items);
  }

  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  async upload(event: Event) {
    event.preventDefault();
    if (!this.selectedFile || !this.cardId) return;
    await this.attachmentService.uploadAttachment(this.cardId, this.selectedFile);
    this.selectedFile = null;
    await this.loadAttachments();
  }

  async deleteAttachment(id: string) {
    if (!confirm('Are you sure you want to delete this attachment file?')) return;
    await this.attachmentService.deleteAttachment(id);
    await this.loadAttachments();
  }
}

