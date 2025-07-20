import { apiCall } from "@/utils/api";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatQueryRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatQueryResponse {
  query: string;
  results: any;
  response: string;
  resultCount: number;
}

export interface ChatContext {
  exampleQueries: string[];
}

export const chatService = {
  async sendQuery(request: ChatQueryRequest): Promise<ChatQueryResponse> {
    const response = await apiCall<ChatQueryResponse>('/chat/query', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to process query');
    }

    return response.data;
  },

  async getChatContext(): Promise<ChatContext> {
    const response = await apiCall<ChatContext>('/chat/context', {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to get chat context');
    }

    return response.data;
  }
}; 