import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CreateListPayload, ListItem, ReorderListsPayload } from './list.types';

@Injectable({ providedIn: 'root' })
export class ListService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getLists(boardId: string): Promise<ListItem[]> {
    return firstValueFrom(this.http.get<ListItem[]>(`${this.apiUrl}/listManagement/board/${boardId}`));
  }

  createList(payload: CreateListPayload): Promise<ListItem> {
    return firstValueFrom(this.http.post<ListItem>(`${this.apiUrl}/listManagement`, payload));
  }

  reorderLists(payload: ReorderListsPayload): Promise<ListItem[]> {
    return firstValueFrom(this.http.put<ListItem[]>(`${this.apiUrl}/listManagement/reorder`, payload));
  }

  deleteList(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/listManagement/${id}`));
  }

  getAllLists(): Promise<ListItem[]> {
    return firstValueFrom(this.http.get<ListItem[]>(`${this.apiUrl}/lists`));
  }
}
