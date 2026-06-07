export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email?: string;
  role?: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  ownerId: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
}

export interface InviteWorkspaceMemberPayload {
  workspaceId: string;
  email: string;
  role: string;
}

export interface UpdateWorkspaceMemberRolePayload {
  role: string;
}
