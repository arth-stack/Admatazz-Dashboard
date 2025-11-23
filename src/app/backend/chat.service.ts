import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private API_URL = 'http://localhost:3000/api/chat';

    constructor(private http: HttpClient) { }

    sendMessage(message: string, systemMessage?: string, chatId?: string): Observable<{ response: string, chatId: string }> {
        return this.http.post<{ response: string, chatId: string }>(this.API_URL, { message, systemMessage, chatId });
    }
}