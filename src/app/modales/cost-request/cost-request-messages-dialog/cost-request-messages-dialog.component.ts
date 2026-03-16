import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ConversationComponent,
  CustomMessageUpdate,
} from "../../../components/conversation/conversation.component";
import { BaseModal } from "../../../models/classes/base-modal";
import { Message, MessageCreate } from "../../../../client/costSeiko";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { AuthenticationService } from "../../../security/authentication.service";

@Component({
  selector: "app-cost-request-messages-dialog",
  imports: [ConversationComponent, ConversationComponent],
  templateUrl: "./cost-request-messages-dialog.component.html",
  styleUrl: "./cost-request-messages-dialog.component.scss",
})
export class CostRequestMessagesDialogComponent
  extends BaseModal
  implements OnInit, OnDestroy
{
  allMessages = signal<Message[]>([]);
  costRequestSelectedId!: string | null;

  currentUserUid = signal<string | null>(null);
  readOnly = signal<boolean>(false);

  constructor(
    private readonly costRequestRepo: CostRequestRepo,
    private readonly authService: AuthenticationService,
  ) {
    super();
  }

  ngOnInit() {
    this.costRequestSelectedId = this.dataConfig.objectId;
    this.readOnly.set(this.dataConfig.readOnly);
    this.initCurrentUserUid();
  }

  ngOnDestroy() {
    this.closeDialog(true);
  }

  initCurrentUserUid() {
    this.currentUserUid.set(this.authService.getUserId());
    if (this.costRequestSelectedId) {
      this.initMessages();
    }
  }

  initMessages() {
    this.costRequestRepo
      .getAllCostRequestMessages(this.costRequestSelectedId!)
      .subscribe({
        next: (messages: Message[]) => {
          if (messages) {
            this.allMessages.set(messages);
          }
        },
      });
  }

  messageCreationReceiver(newMessage: MessageCreate) {
    this.costRequestRepo
      .createCostRequestMessage(this.costRequestSelectedId!, newMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages: Message[]) => {
          if (messages) {
            this.allMessages.set(messages);
          }
        },
      });
  }

  messageDeletionReceiver(messageId: string) {
    this.costRequestRepo
      .deleteCostRequestMessage(this.costRequestSelectedId!, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allMessages.update((messages) =>
            messages.map((message) => {
              if (message.uid === messageId) {
                return {
                  ...message,
                  deleted: true,
                };
              }
              return message;
            }),
          );
        },
      });
  }

  messageUndoReceiver(messageId: string) {
    this.costRequestRepo
      .undoCostRequestMessage(this.costRequestSelectedId!, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMessages: Message) => {
          if (updatedMessages) {
            this.allMessages.update((messages) =>
              messages.map((mess) =>
                mess.uid === updatedMessages.uid ? updatedMessages : mess,
              ),
            );
          }
        },
      });
  }

  messageUpdateReceiver(customMessageUpdate: CustomMessageUpdate) {
    this.costRequestRepo
      .updateCostRequestMessage(
        this.costRequestSelectedId!,
        customMessageUpdate.uid,
        customMessageUpdate.messageUpdate,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMessages: Message) => {
          if (updatedMessages) {
            this.allMessages.update((messages) =>
              messages.map((mess) =>
                mess.uid === updatedMessages.uid ? updatedMessages : mess,
              ),
            );
          }
        },
      });
  }
}
