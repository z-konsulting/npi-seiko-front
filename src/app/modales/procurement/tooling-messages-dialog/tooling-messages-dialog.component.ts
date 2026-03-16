import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ConversationComponent,
  CustomMessageUpdate,
} from "../../../components/conversation/conversation.component";
import { BaseModal } from "../../../models/classes/base-modal";
import { Message, MessageCreate } from "../../../../client/costSeiko";
import { ToolingRepo } from "../../../repositories/tooling.repo";
import { AuthenticationService } from "../../../security/authentication.service";

@Component({
  selector: "app-tooling-messages-dialog",
  imports: [ConversationComponent],
  templateUrl: "./tooling-messages-dialog.component.html",
  styleUrl: "./tooling-messages-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolingMessagesDialogComponent
  extends BaseModal
  implements OnInit
{
  allMessages = signal<Message[]>([]);
  currentUserUid = signal<string | null>(null);
  readOnly = signal<boolean>(false);

  private toolingRepo = inject(ToolingRepo);
  private authService = inject(AuthenticationService);

  private toolingUid!: string;

  ngOnInit(): void {
    this.toolingUid = this.dataConfig.toolingUid;
    this.readOnly.set(this.dataConfig.readOnly);
    this.currentUserUid.set(this.authService.getUserId());
    this.loadMessages();
  }

  messageCreationReceiver(newMessage: MessageCreate): void {
    this.toolingRepo
      .createToolingCostLineMessage(this.toolingUid, newMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages: Message[]) => {
          if (messages) {
            this.allMessages.set(messages);
          }
        },
      });
  }

  messageDeletionReceiver(messageId: string): void {
    this.toolingRepo
      .deleteToolingCostLineMessage(this.toolingUid, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allMessages.update((messages) =>
            messages.map((message) =>
              message.uid === messageId
                ? { ...message, deleted: true }
                : message,
            ),
          );
        },
      });
  }

  messageUndoReceiver(messageId: string): void {
    this.toolingRepo
      .undoToolingCostLineMessage(this.toolingUid, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMessage: Message) => {
          if (updatedMessage) {
            this.allMessages.update((messages) =>
              messages.map((mess) =>
                mess.uid === updatedMessage.uid ? updatedMessage : mess,
              ),
            );
          }
        },
      });
  }

  messageUpdateReceiver(customMessageUpdate: CustomMessageUpdate): void {
    this.toolingRepo
      .updateToolingCostLineMessage(
        this.toolingUid,
        customMessageUpdate.uid,
        customMessageUpdate.messageUpdate,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMessage: Message) => {
          if (updatedMessage) {
            this.allMessages.update((messages) =>
              messages.map((mess) =>
                mess.uid === updatedMessage.uid ? updatedMessage : mess,
              ),
            );
          }
        },
      });
  }

  private loadMessages(): void {
    this.toolingRepo.getAllToolingCostMessages(this.toolingUid).subscribe({
      next: (messages: Message[]) => {
        if (messages) {
          this.allMessages.set(messages);
        }
      },
    });
  }
}
