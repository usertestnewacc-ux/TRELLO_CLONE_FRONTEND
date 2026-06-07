import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  CreateWorkspacePayload,
  InviteWorkspaceMemberPayload,
  UpdateWorkspaceMemberRolePayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceMember
} from './workspace.types';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5108/api';

  getWorkspaces(): Promise<Workspace[]> {
    return firstValueFrom(this.http.get<Workspace[]>(`${this.apiUrl}/workspaces`));
  }

  createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    return firstValueFrom(this.http.post<Workspace>(`${this.apiUrl}/workspaces`, payload));
  }

  updateWorkspace(id: string, payload: UpdateWorkspacePayload): Promise<Workspace> {
    return firstValueFrom(this.http.put<Workspace>(`${this.apiUrl}/workspaces/${id}`, payload));
  }

  deleteWorkspace(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.apiUrl}/workspaces/${id}`));
  }

  getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return firstValueFrom(
      this.http.get<WorkspaceMember[]>(`${this.apiUrl}/workspaceMembers?workspaceId=${workspaceId}`)
    );
  }

  inviteMember(payload: InviteWorkspaceMemberPayload): Promise<WorkspaceMember> {
    return firstValueFrom(
      this.http.post<WorkspaceMember>(`${this.apiUrl}/workspaceMembers/invite`, payload)
    );
  }

  updateMemberRole(memberId: string, payload: UpdateWorkspaceMemberRolePayload): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/workspaceMembers/${memberId}/role`, payload)
    );
  }

  removeMember(memberId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/workspaceMembers/${memberId}`)
    );
  }
}
