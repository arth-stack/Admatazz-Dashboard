import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService } from '../../backend/chat.service';
import { AuthService, AppUser } from '../../backend/auth.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSummary {
  id: string;
  name: string;
}

@Component({
  selector: 'app-search-deck',
  standalone: false,
  templateUrl: './search-deck.component.html',
  styleUrls: ['./search-deck.component.css']
})
export class SearchDeckComponent implements OnInit, AfterViewChecked {
  currentUser: { email: string; displayName: string; } | null = null;
  userMessage = '';
  loading = false;

  chatHistory: ChatMessage[] = [];
  systemMessage = 'You are a helpful assistant specialized in summarizing decks.';

  currentChatId: string | null = null;
  allChats: ChatSummary[] = [];

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(private authService: AuthService, private chatService: ChatService) { }

  ngOnInit(): void {
    const user: AppUser | null = this.authService.getStoredUser();
    if (user) {
      this.currentUser = {
        email: user.email ?? 'Unknown',
        displayName: user.displayName ?? 'Unknown',
      };
    }    

    this.startNewChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  startNewChat() {
    this.currentChatId = null;
    this.chatHistory = [{ role: 'system', content: this.systemMessage }];
  }

  selectChat(chatId: string) {
    this.currentChatId = chatId;
    // TODO: Load messages for chatId
  }

  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;

    const messageToSend = this.userMessage;
    this.chatHistory.push({ role: 'user', content: messageToSend });
    this.userMessage = '';
    this.loading = true;

    this.chatService.sendMessage(messageToSend, this.systemMessage, this.currentChatId || undefined)
      .subscribe({
        next: res => {
          setTimeout(() => {
            this.chatHistory.push({ role: 'assistant', content: res.response });

            if (!this.currentChatId) {
              this.currentChatId = res.chatId;
              if (!this.allChats.find(c => c.id === res.chatId)) {
                this.allChats.push({ id: res.chatId, name: `Chat ${this.allChats.length + 1}` });
              }
            }
            this.loading = false;
          }, 300);
        },
        error: () => {
          this.chatHistory.push({ role: 'assistant', content: 'Error contacting server' });
          this.loading = false;
        }
      });
  }

  private scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  logout() {
    this.authService.signOut().then(() => {
      this.currentUser = null;
      this.startNewChat(); // Reset chat on logout
      // Optional: redirect to login page
      window.location.reload();
    }).catch(err => {
      console.error('Logout failed', err);
    });
  }

  get timeEmoji(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '🌞';     // Morning
    if (hour >= 12 && hour < 17) return '☀️';    // Afternoon
    if (hour >= 17 && hour < 20) return '🌅';    // Evening
    return '🌜';                                 // Night
  }
}