export interface Board {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  email?: string;
  role?: string;
}

export interface CreateBoardPayload {
  workspaceId: string;
  name: string;
  description?: string;
  createdById: string;
}

export interface UpdateBoardPayload {
  name?: string;
  description?: string;
}

export interface InviteBoardMemberPayload {
  boardId: string;
  email: string;
  role: string;
}

export interface UpdateBoardMemberRolePayload {
  role: string;
}
