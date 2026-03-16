import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { Icons } from "../../models/enums/icons";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import {
  Message,
  MessageCreate,
  MessageUpdate,
} from "../../../client/costSeiko";
import { Textarea } from "primeng/textarea";
import { Popover } from "primeng/popover";
import { Button } from "primeng/button";

export interface CustomMessageUpdate {
  uid: string;
  messageUpdate: MessageUpdate;
}

@Component({
  selector: "app-conversation",
  imports: [FormsModule, InputTextModule, Textarea, Popover, Button],
  templateUrl: "./conversation.component.html",
  styleUrl: "./conversation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationComponent implements OnInit {
  msgPopover = viewChild.required<Popover>("msgPopover");
  chatMessages = viewChild<ElementRef<HTMLDivElement>>("chatMessages");
  messages = input.required<Message[]>();
  currentUserUid = input.required<string>();
  readonly = input<boolean>(false);
  otherOptionPossible = input<boolean>(true);
  messageCreationEmitter = output<MessageCreate>();
  messageDeletionEmitter = output<string>();
  messageUpdateEmitter = output<CustomMessageUpdate>();
  messageUndoEmitter = output<string>();
  messageContent: string | null = null;
  updateMessageContent: string | null = null;
  updateMessageIndex = signal<number | null>(null);
  activeMenuMessage = signal<{ message: Message; index: number } | null>(null);
  isScrolledUp = signal<boolean>(false);
  protected readonly Icons = Icons;
  private isScrollingToBottom = false;
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 600);
  }

  addMessage() {
    const message: MessageCreate = {
      content: this.messageContent!,
    };
    this.messageCreationEmitter.emit(message);
    this.messageContent = null;
    setTimeout(() => this.scrollToBottom(), 50);
  }

  isCurrentUser(userId: string) {
    return this.currentUserUid() === userId;
  }

  messageUndo(userId: string) {
    this.messageUndoEmitter.emit(userId);
    this.cdr.markForCheck();
  }

  isUpdateValidBtnDisable() {
    return (
      !this.updateMessageContent ||
      this.updateMessageContent.trim() === "" ||
      this.updateMessageContent ===
        this.messages()[this.updateMessageIndex()!].content
    );
  }

  onScroll(event: Event) {
    if (this.isScrollingToBottom) return;
    const el = event.target as HTMLElement;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.isScrolledUp.set(distanceFromBottom > 100);
  }

  scrollToBottom() {
    this.isScrolledUp.set(false);
    this.isScrollingToBottom = true;

    const el = this.chatMessages()?.nativeElement;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    setTimeout(() => {
      this.isScrollingToBottom = false;
    }, 600);
  }

  openMenu(event: MouseEvent, index: number, message: Message) {
    this.activeMenuMessage.set({ message, index });
    this.msgPopover().toggle(event);
  }

  executeEdit() {
    const ctx = this.activeMenuMessage();
    if (!ctx) return;
    this.msgPopover().hide();
    this.updateMessage(ctx.index, ctx.message);
  }

  executeDelete() {
    const ctx = this.activeMenuMessage();
    if (!ctx) return;
    this.msgPopover().hide();
    this.deleteMessage(ctx.message.uid);
  }

  updateMessage(index: number, message: Message) {
    this.updateMessageContent = message.content;
    this.updateMessageIndex.set(index);
  }

  validateUpdateMessage() {
    const updateMessage: CustomMessageUpdate = {
      uid: this.messages()[this.updateMessageIndex()!].uid,
      messageUpdate: {
        content: this.updateMessageContent!,
      },
    };
    this.messageUpdateEmitter.emit(updateMessage);
    this.updateMessageIndex.set(null);
    this.updateMessageContent = null;
  }

  cancelUpdateMessage() {
    this.updateMessageIndex.set(null);
    this.updateMessageContent = null;
  }

  deleteMessage(messageId: string) {
    this.messageDeletionEmitter.emit(messageId);
    this.cdr.markForCheck();
  }

  bubbleClass(index: number, message: Message): string {
    if (index === this.updateMessageIndex()) {
      return "msg-bubble msg-bubble--editing";
    }
    return `msg-bubble ${this.contentClass(message)}`;
  }

  contentClass(message: Message): string {
    return message.deleted
      ? "content-deleted"
      : this.isCurrentUser(message.userUid)
        ? "current-user-content"
        : "other-user-content";
  }
}
