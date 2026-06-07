import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Board,
  BoardMember,
  CreateBoardPayload,
  InviteBoardMemberPayload,
  UpdateBoardMemberRolePayload,
  UpdateBoardPayload
} from './board.types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getBoards(): Promise<Board[]> {
    return firstValueFrom(this.http.get<Board[]>(`${this.apiUrl}/boards`));
  }

  createBoard(payload: CreateBoardPayload): Promise<Board> {
    return firstValueFrom(this.http.post<Board>(`${this.apiUrl}/boards`, payload));
  }

  updateBoard(id: string, payload: UpdateBoardPayload): Promise<Board> {
    return firstValueFrom(this.http.put<Board>(`${this.apiUrl}/boards/${id}`, payload));
  }

  deleteBoard(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/boards/${id}`));
  }

  getBoardMembers(boardId: string): Promise<BoardMember[]> {
    return firstValueFrom(
      this.http.get<BoardMember[]>(`${this.apiUrl}/boardMembers?boardId=${boardId}`)
    );
  }

  inviteMember(payload: InviteBoardMemberPayload): Promise<BoardMember> {
    return firstValueFrom(
      this.http.post<BoardMember>(`${this.apiUrl}/boardMembers/invite`, payload)
    );
  }

  updateMemberRole(memberId: string, payload: UpdateBoardMemberRolePayload): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/boardMembers/${memberId}/role`, payload)
    );
  }

  removeMember(memberId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/boardMembers/${memberId}`)
    );
  }
}
