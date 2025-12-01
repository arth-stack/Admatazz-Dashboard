import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  success: boolean;
  response: string;
  decks: any[];
  deckCount: number;
  error?: string;
  chatId?: string;
}

export interface SearchSuggestions {
  success: boolean;
  suggestions: {
    categories: string[];
    industries: string[];
    deckTypes: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  //private API_URL = 'http://localhost:3000/api/chat';
  private API_URL = 'https://admatazz-dashboard.onrender.com/api/chat';

  constructor(private http: HttpClient) { }

  sendMessage(message: string, chatId?: string, conversationHistoryForBackend?: { role: "user" | "assistant" | "system"; content: string; decks: any[] | undefined; }[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.API_URL}/chat`, { 
      message,
      chatId 
    });
  }

  getSuggestions(): Observable<SearchSuggestions> {
    return this.http.get<SearchSuggestions>(`${this.API_URL}/suggestions`);
  }
}