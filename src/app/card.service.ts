import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CardItem, CreateCardPayload, ReorderCardsPayload, UpdateCardPayload } from './card.types';

@Injectable({ providedIn: 'root' })
export class CardService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getCards(listId: string): Promise<CardItem[]> {
    return firstValueFrom(this.http.get<CardItem[]>(`${this.apiUrl}/cardManagement/list/${listId}`));
  }

  createCard(payload: CreateCardPayload): Promise<CardItem> {
    return firstValueFrom(this.http.post<CardItem>(`${this.apiUrl}/cards`, payload));
  }

  updateCard(id: string, payload: UpdateCardPayload): Promise<CardItem> {
    return firstValueFrom(this.http.put<CardItem>(`${this.apiUrl}/cards/${id}`, payload));
  }

  deleteCard(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/cards/${id}`));
  }

  reorderCards(payload: ReorderCardsPayload): Promise<CardItem[]> {
    return firstValueFrom(this.http.put<CardItem[]>(`${this.apiUrl}/cardManagement/reorder`, payload));
  }

  getAllCards(): Promise<CardItem[]> {
    return firstValueFrom(this.http.get<CardItem[]>(`${this.apiUrl}/cards`));
  }
}
