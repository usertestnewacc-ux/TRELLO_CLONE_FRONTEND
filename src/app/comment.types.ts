export interface CommentItem {
  id: string;
  cardId: string;
  userId: string;
  commentText: string;
  createdAt: string;
}

export interface CreateCommentPayload {
  cardId: string;
  userId: string;
  commentText: string;
}
