import { apiFetch, unwrapData } from './apiClient';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'EMPLOYEE';
  senderUserId: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface Conversation {
  id: string;
  customerId: string;
  branchId: string;
  assignedEmployeeId?: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  subject?: string | null;
  contextType?: string | null;
  contextId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  customer?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
      phone?: string;
    };
  };
  branch?: {
    id: string;
    name: string;
    code: string;
    phone?: string;
    email?: string;
  };
  assignedEmployee?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
    };
  };
  messages?: ChatMessage[];
  unreadCount?: number;
}

export interface CreateConversationPayload {
  branchId: string;
  subject?: string;
  contextType?: string;
  contextId?: string;
  initialMessage?: string;
}

export const chatService = {
  async getConversations(params?: { branchId?: string; search?: string }): Promise<Conversation[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.branchId) queryParams.append('branchId', params.branchId);
      if (params?.search) queryParams.append('search', params.search);

      const qs = queryParams.toString();
      const res = await apiFetch<any>(`/chat/conversations${qs ? `?${qs}` : ''}`);
      const unwrapped = unwrapData<any>(res);
      if (Array.isArray(unwrapped)) return unwrapped;
      if (unwrapped && Array.isArray(unwrapped.data)) return unwrapped.data;
      return [];
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    }
  },

  async getConversationById(id: string): Promise<Conversation> {
    const res = await apiFetch<any>(`/chat/conversations/${id}`);
    return unwrapData<Conversation>(res);
  },

  async createOrGetConversation(payload: CreateConversationPayload): Promise<Conversation> {
    const res = await apiFetch<any>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapData<Conversation>(res);
  },

  async sendMessage(conversationId: string, message: string): Promise<ChatMessage> {
    const res = await apiFetch<any>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return unwrapData<ChatMessage>(res);
  },

  async assignConversation(conversationId: string, employeeId: string): Promise<Conversation> {
    const res = await apiFetch<any>(`/chat/conversations/${conversationId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ employeeId }),
    });
    return unwrapData<Conversation>(res);
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiFetch<any>('/chat/conversations/unread-count');
      const data = unwrapData<{ unreadCount: number }>(res);
      return data?.unreadCount || 0;
    } catch {
      return 0;
    }
  },
};
