export interface ListItem {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

export interface CreateListPayload {
  boardId: string;
  title: string;
  position: number;
}

export interface ReorderListItemPayload {
  listId: string;
  position: number;
}

export interface ReorderListsPayload {
  boardId: string;
  items: ReorderListItemPayload[];
}
