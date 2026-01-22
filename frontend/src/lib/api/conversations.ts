import { strapiApi } from './strapi';

export interface User {
  id: number;
  username: string;
  email: string;
  companyName?: string;
  userType: 'admin' | 'reseller';
}

export interface Conversation {
  id: number;
  participant_admin: User;
  participant_partner: User;
  lastMessageAt: string | null;
  lastMessagePreview: string;
  unreadCount_admin: number;
  unreadCount_partner: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: User;
  content: string;
  messageType: 'text' | 'system' | 'order_update';
  relatedOrder?: {
    id: number;
    inquiryNumber: string;
  };
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  data: Conversation[];
}

export interface ConversationResponse {
  data: Conversation;
}

export interface MessagesResponse {
  data: Message[];
}

export interface MessageResponse {
  data: Message;
}

// Get all conversations for current user
export async function getConversations(): Promise<Conversation[]> {
  const response = await strapiApi.get<ConversationsResponse>('/api/conversations');
  return response.data.data;
}

// Get single conversation with messages
export async function getConversation(id: number): Promise<Conversation> {
  const response = await strapiApi.get<ConversationResponse>(`/api/conversations/${id}`);
  return response.data.data;
}

// Find or create conversation with specific user
export async function findOrCreateConversation(userId: number): Promise<Conversation> {
  const response = await strapiApi.post<ConversationResponse>(
    `/api/conversations/with-user/${userId}`
  );
  return response.data.data;
}

// Get messages for a conversation (paginated)
export async function getMessages(
  conversationId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<Message[]> {
  const response = await strapiApi.get<MessagesResponse>('/api/messages', {
    params: { conversationId, page, pageSize },
  });
  return response.data.data;
}

// Send a new message
export async function sendMessage(
  conversationId: number,
  content: string,
  relatedOrderId?: number
): Promise<Message> {
  const response = await strapiApi.post<MessageResponse>('/api/messages', {
    conversationId,
    content,
    messageType: 'text',
    relatedOrderId,
  });
  return response.data.data;
}

// Mark conversation as read
export async function markConversationAsRead(conversationId: number): Promise<void> {
  await strapiApi.put(`/api/conversations/${conversationId}/mark-read`);
}

// Get total unread message count
export async function getUnreadCount(): Promise<number> {
  const response = await strapiApi.get<{ unreadCount: number }>('/api/conversations/unread-count');
  return response.data.unreadCount;
}
