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
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { AuthenticationService } from "../../../security/authentication.service";

@Component({
  selector: "app-cost-request-line-messages-dialog",
  imports: [ConversationComponent],
  templateUrl: "./cost-request-line-messages-dialog.component.html",
  styleUrl: "./cost-request-line-messages-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestLineMessagesDialogComponent
  extends BaseModal
  implements OnInit
{
  allMessages = signal<Message[]>([]);
  currentUserUid = signal<string | null>(null);
  readOnly = signal<boolean>(false);

  private costRequestLineRepo = inject(CostRequestLineRepo);
  private authService = inject(AuthenticationService);

  private costRequestUid!: string;
  private lineUid!: string;

  ngOnInit(): void {
    this.costRequestUid = this.dataConfig.costRequestUid;
    this.lineUid = this.dataConfig.lineUid;
    this.readOnly.set(this.dataConfig.readOnly);
    this.currentUserUid.set(this.authService.getUserId());
    this.loadMessages();
  }

  messageCreationReceiver(newMessage: MessageCreate): void {
    this.costRequestLineRepo
      .createCostRequestLineMessage(
        this.costRequestUid,
        this.lineUid,
        newMessage,
      )
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
    this.costRequestLineRepo
      .deleteCostRequestLineMessage(
        this.costRequestUid,
        this.lineUid,
        messageId,
      )
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
    this.costRequestLineRepo
      .undoCostRequestLineMessage(this.costRequestUid, this.lineUid, messageId)
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
    this.costRequestLineRepo
      .updateCostRequestLineMessage(
        this.costRequestUid,
        this.lineUid,
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
    this.costRequestLineRepo
      .getAllCostRequestMessages(this.costRequestUid, this.lineUid)
      .subscribe({
        next: (messages: Message[]) => {
          if (messages) {
            this.allMessages.set(messages);
          }
        },
      });
  }
}
