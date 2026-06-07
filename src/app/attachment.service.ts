import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AttachmentItem } from './attachment.types';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getAttachments(cardId: string): Promise<AttachmentItem[]> {
    return firstValueFrom(this.http.get<AttachmentItem[]>(`${this.apiUrl}/attachments/card/${cardId}`));
  }

  uploadAttachment(cardId: string, file: File): Promise<AttachmentItem> {
    const formData = new FormData();
    formData.append('cardId', cardId);
    formData.append('file', file);
    return firstValueFrom(this.http.post<AttachmentItem>(`${this.apiUrl}/attachments/upload`, formData));
  }

  deleteAttachment(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/attachments/${id}`));
  }
}
