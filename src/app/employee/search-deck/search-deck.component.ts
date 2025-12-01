import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService, ChatResponse } from '../../backend/chat.service';
import { AuthService, AppUser } from '../../backend/auth.service';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'linkify' })
export class LinkifyPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(
      /\[Download\]\((https?:\/\/[^\s]+)\)/g,
      '<a href="$1" target="_blank" class="text-blue-500 underline">Download</a>'
    );
  }
}

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    let html = value;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Links
    html = html.replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>');

    // Line breaks
    html = html.replace(/\n/gim, '<br>');

    // Code blocks
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-red-600 text-sm">$1</code>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-2 text-gray-600">$1</blockquote>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  loading?: boolean;
  decks?: any[];
}

interface ChatSummary {
  id: string;
  name: string;
}

interface Deck {
  _id: string;
  title: string;
  file_path: string;
  deck_type: string;
  category: string;
  industry: string;
  uploaded_by: string;
  uploaded_at: string;
}

@Component({
  selector: 'app-search-deck',
  standalone: false,
  templateUrl: './search-deck.component.html',
  styleUrls: ['./search-deck.component.css']
})
export class SearchDeckComponent implements OnInit {
  currentUser: { email: string; displayName: string } | null = null;
  userMessage = '';
  loading = false;
  showGreeting = true;
  private typingInterval: any = null;

  predefinedQuestions: string[] = [
    "Find SEO Strategy decks",
    "Find Media Strategy decks", 
    "Find Creative Strategy decks",
    "Find Pitch decks for Technology industry",
    "Find Marketing decks",
    "Find Sales presentation decks",
    "Show me all Business Plan decks",
    "Find decks about Healthcare industry"
  ];

  chatHistory: ChatMessage[] = [];
  currentChatId: string | null = null;
  allChats: ChatSummary[] = [];

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(
    private authService: AuthService, 
    private chatService: ChatService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const user: AppUser | null = this.authService.getStoredUser();
    if (user) {
      this.currentUser = {
        email: user.email ?? 'Unknown',
        displayName: user.displayName ?? 'Unknown',
      };
    }
    this.startNewChat();
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.stopAI();
    }
  }

  startNewChat() {
    this.currentChatId = null;
    this.chatHistory = [];
    this.showGreeting = true;
  }

  selectChat(chatId: string) {
    this.currentChatId = chatId;
    // TODO: Load chat messages for this ID
  }

  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;

    this.showGreeting = false;
    const messageToSend = this.userMessage;

    // Add user message
    this.chatHistory.push({ role: 'user', content: messageToSend });
    this.userMessage = '';
    this.loading = true;

    // Add empty assistant message immediately for loader
    const assistantMsg: ChatMessage = { 
      role: 'assistant', 
      content: '', 
      loading: true,
      decks: [] 
    };
    this.chatHistory.push(assistantMsg);

    // Set a timeout to show "Searching database..." if response takes >2s
    const waitMessageTimeout = setTimeout(() => {
      if (assistantMsg.loading && !assistantMsg.content) {
        assistantMsg.content = '🔍 Searching database for matching decks...';
      }
    }, 2000);

    this.chatService.sendMessage(messageToSend, this.currentChatId || undefined)
      .subscribe({
        next: (res: ChatResponse) => {
          clearTimeout(waitMessageTimeout);
          
          if (!this.currentChatId && res.chatId) {
            this.currentChatId = res.chatId;
            if (!this.allChats.find(c => c.id === res.chatId)) {
              this.allChats.push({ id: res.chatId, name: `Chat ${this.allChats.length + 1}` });
            }
          }

          // Update the assistant message with AI response and decks
          assistantMsg.decks = res.decks || [];
          
          // Replace wait message if shown
          if (assistantMsg.content.startsWith('🔍')) {
            assistantMsg.content = '';
          }
          
          this.startTypingAnimation(assistantMsg, res.response);
        },
        error: (error) => {
          clearTimeout(waitMessageTimeout);
          assistantMsg.content = '❌ Error: Could not search database. Please try again.';
          assistantMsg.loading = false;
          this.loading = false;
          console.error('Chat error:', error);
        }
      });
  }

  startTypingAnimation(assistantMsg: ChatMessage, message: string) {
    let i = 0;
    if (this.typingInterval) clearInterval(this.typingInterval);

    this.typingInterval = setInterval(() => {
      assistantMsg.content += message[i];
      i++;
      if (i >= message.length) {
        clearInterval(this.typingInterval);
        this.typingInterval = null;
        assistantMsg.loading = false;
        this.loading = false;
      }
    }, 20);
  }

  stopAI() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
    this.loading = false;
  }

  logout() {
    this.authService.signOut().then(() => {
      this.currentUser = null;
      this.startNewChat();
      window.location.reload();
    }).catch(err => console.error('Logout failed', err));
  }

  get timeEmoji(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '🌞';
    if (hour >= 12 && hour < 17) return '☀️';
    if (hour >= 17 && hour < 20) return '🌅';
    return '🌜';
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  sendPredefined(text: string) {
    this.userMessage = text;
    this.sendMessage();
  }

  typeMessage(msg: ChatMessage, text: string, callback?: () => void) {
    let i = 0;
    if (this.typingInterval) clearInterval(this.typingInterval);

    msg.content = '';
    this.typingInterval = setInterval(() => {
      msg.content += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(this.typingInterval);
        this.typingInterval = null;
        if (callback) callback();
      }
    }, 20);
  }

  // Helper method to format markdown content using our custom parser
  formatMarkdown(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    
    let html = content;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // Lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li>.*<\/li>)+/gim, '<ul class="list-disc ml-6 my-2">$&</ul>');

    // Links
    html = html.replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" class="text-blue-500 underline hover:text-blue-700">$1</a>');

    // Line breaks
    html = html.replace(/\n/gim, '<br>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-2 py-1 rounded text-red-600 text-sm font-mono">$1</code>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-3 text-gray-600 bg-blue-50 py-2">$1</blockquote>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Helper method to format deck display
  trackDeck(index: number, deck: any): any {
    return deck._id || index;
  }
}