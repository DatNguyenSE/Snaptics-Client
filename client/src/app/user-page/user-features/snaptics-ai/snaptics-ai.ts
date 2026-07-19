import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatStorageService, Conversation, ChatMessage } from '../../../core/services/chat-storage.service';
import { MockAiService } from '../../../core/services/mock-ai.service';
import { ConversationHistory } from './components/conversation-history/conversation-history';
import { ChatWorkspace } from './components/chat-workspace/chat-workspace';
import { RenameConversationDialog } from './components/rename-conversation-dialog/rename-conversation-dialog';
import { DeleteConversationDialog } from './components/delete-conversation-dialog/delete-conversation-dialog';

@Component({
  selector: 'app-snaptics-ai-page',
  standalone: true,
  imports: [
    CommonModule,
    ConversationHistory,
    ChatWorkspace,
    RenameConversationDialog,
    DeleteConversationDialog
  ],
  templateUrl: './snaptics-ai.html',
  styleUrl: './snaptics-ai.css'
})
export class SnapticsAIPage implements OnInit, OnDestroy {
  protected readonly chatStorage = inject(ChatStorageService);
  private readonly mockAi = inject(MockAiService);

  activeConversationId = signal<string>('');
  isHistoryCollapsed = signal<boolean>(false);
  isAiResponding = signal<boolean>(false);

  // Dialog states
  isRenameOpen = false;
  conversationToRename: Conversation | null = null;

  isDeleteOpen = false;
  conversationToDelete: Conversation | null = null;

  private aiSubscription?: Subscription;

  ngOnInit() {
    // Select the first conversation in history or create one if empty
    const list = this.chatStorage.conversations();
    if (list.length > 0) {
      // Find pinned first, otherwise the first item
      const pinned = list.find(c => c.isPinned);
      this.activeConversationId.set(pinned ? pinned.id : list[0].id);
    } else {
      this.createNewChat();
    }
  }

  ngOnDestroy() {
    this.cancelAiRequest();
  }

  get activeConversation(): Conversation | undefined {
    return this.chatStorage.getConversationById(this.activeConversationId());
  }

  selectConversation(id: string) {
    this.cancelAiRequest();
    this.activeConversationId.set(id);
  }

  createNewChat() {
    this.cancelAiRequest();
    const newConv = this.chatStorage.createNewConversation();
    this.activeConversationId.set(newConv.id);
  }

  clearAllChats() {
    this.cancelAiRequest();
    this.chatStorage.clearAll();
    this.createNewChat();
  }

  // --- Send Message & Mock Response ---
  sendMessage(payload: { content: string; file: File | null; dataRange: string }) {
    if (this.isAiResponding()) return;

    const convId = this.activeConversationId();
    if (!convId) return;

    let attachmentUrl = '';
    if (payload.file) {
      attachmentUrl = URL.createObjectURL(payload.file);
    }

    // Add user message to state
    this.chatStorage.addMessage(convId, {
      role: 'user',
      content: payload.content,
      attachment: payload.file
        ? {
            name: payload.file.name,
            url: attachmentUrl,
            type: payload.file.type,
          }
        : undefined,
    });

    // Start AI processing
    this.isAiResponding.set(true);

    this.aiSubscription = this.mockAi
      .generateResponse(payload.content, payload.dataRange, convId, !!payload.file)
      .subscribe({
        next: (aiMessage) => {
          this.chatStorage.addMessage(convId, {
            role: 'assistant',
            content: aiMessage.content || '',
            status: 'completed',
            analysisData: aiMessage.analysisData,
          });
          this.isAiResponding.set(false);
        },
        error: (err) => {
          console.error('Mock AI error:', err);
          this.chatStorage.addMessage(convId, {
            role: 'assistant',
            content: 'Snaptics AI chưa thể phân tích dữ liệu lúc này. Vui lòng thử lại.',
            status: 'error',
          });
          this.isAiResponding.set(false);
        },
      });
  }

  regenerateResponse(messageId: string) {
    if (this.isAiResponding()) return;

    const conv = this.activeConversation;
    if (!conv) return;

    // Find the message index
    const msgIndex = conv.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Find the user prompt before this assistant response
    let prompt = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        prompt = conv.messages[i].content;
        break;
      }
    }

    if (!prompt) return;

    // Set AI responding
    this.isAiResponding.set(true);

    this.aiSubscription = this.mockAi
      .generateResponse(prompt, 'month', conv.id)
      .subscribe({
        next: (aiMessage) => {
          this.chatStorage.addMessage(conv.id, {
            role: 'assistant',
            content: aiMessage.content || '',
            status: 'completed',
            analysisData: aiMessage.analysisData,
          });
          this.isAiResponding.set(false);
        },
        error: (err) => {
          console.error('Regenerate AI error:', err);
          this.chatStorage.addMessage(conv.id, {
            role: 'assistant',
            content: 'Snaptics AI chưa thể phân tích dữ liệu lúc này. Vui lòng thử lại.',
            status: 'error',
          });
          this.isAiResponding.set(false);
        },
      });
  }

  cancelAiRequest() {
    if (this.aiSubscription) {
      this.aiSubscription.unsubscribe();
      this.aiSubscription = undefined;
    }
    this.isAiResponding.set(false);
  }

  // --- Pins, Renames, Deletions ---
  togglePin(id: string) {
    this.chatStorage.togglePin(id);
  }

  openRenameDialog(conv: Conversation) {
    this.conversationToRename = conv;
    this.isRenameOpen = true;
  }

  closeRenameDialog() {
    this.conversationToRename = null;
    this.isRenameOpen = false;
  }

  saveRename(newTitle: string) {
    if (this.conversationToRename && newTitle.trim()) {
      this.chatStorage.renameConversation(this.conversationToRename.id, newTitle.trim());
      this.closeRenameDialog();
    }
  }

  openDeleteDialog(conv: Conversation) {
    this.conversationToDelete = conv;
    this.isDeleteOpen = true;
  }

  closeDeleteDialog() {
    this.conversationToDelete = null;
    this.isDeleteOpen = false;
  }

  confirmDelete() {
    if (this.conversationToDelete) {
      const deleteId = this.conversationToDelete.id;
      this.chatStorage.deleteConversation(deleteId);
      this.closeDeleteDialog();

      // If we deleted the active conversation, switch to another one
      if (this.activeConversationId() === deleteId) {
        const list = this.chatStorage.conversations();
        if (list.length > 0) {
          this.activeConversationId.set(list[0].id);
        } else {
          this.createNewChat();
        }
      }
    }
  }
}
