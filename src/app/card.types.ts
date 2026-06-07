export interface CardItem {
  id: string;
  listId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignedUserId?: string;
  position: number;
  status?: string;
}

export interface CreateCardPayload {
  listId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignedUserId?: string;
  position: number;
  status?: string;
}

export interface UpdateCardPayload {
  listId?: string;
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignedUserId?: string;
  position?: number;
  status?: string;
}

export interface ReorderCardItemPayload {
  cardId: string;
  listId: string;
  position: number;
}

export interface ReorderCardsPayload {
  listId: string;
  items: ReorderCardItemPayload[];
}
