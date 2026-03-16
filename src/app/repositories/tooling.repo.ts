import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  FileInfo,
  MessageCreate,
  MessageUpdate,
  Tooling,
  ToolingCostLine,
  ToolingCostLineEstimate,
  ToolingCostLineReject,
  ToolingCostLinesPaginated,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class ToolingRepo {
  constructor(private toolingService: Tooling) {}

  searchToolingsToBeEstimated(
    offset: number,
    limit: number,
    search?: string,
  ): Observable<ToolingCostLinesPaginated> {
    return fromRequest(
      this.toolingService.searchToolingsToBeEstimated({
        body: { searchText: search ?? "" },
        query: { offset, limit },
      }),
    );
  }

  estimateToolingCostLine(
    uid: string,
    body: ToolingCostLineEstimate,
  ): Observable<ToolingCostLine> {
    return fromRequest(
      this.toolingService.estimateToolingCostLine({
        path: { uid },
        body,
      }),
    );
  }

  rejectToolingCostLine(
    uid: string,
    body: ToolingCostLineReject,
  ): Observable<ToolingCostLine> {
    return fromRequest(
      this.toolingService.rejectToolingCostLine({
        path: { uid },
        body,
      }),
    );
  }

  getAllToolingCostLineFiles(costingLineUid: string): Observable<FileInfo[]> {
    return fromRequest(
      this.toolingService.getToBeEstimatedToolingCostLineFilesMetadata({
        path: { uid: costingLineUid },
      }),
    );
  }

  // ============================================
  // MESSAGES
  // ============================================

  getAllToolingCostMessages(toolingUid: string) {
    return fromRequest(
      this.toolingService.getAllToolingMessages({
        path: {
          uid: toolingUid,
        },
      }),
    );
  }

  createToolingCostLineMessage(toolingUid: string, newMessage: MessageCreate) {
    return fromRequest(
      this.toolingService.createToolingMessage({
        path: {
          uid: toolingUid,
        },
        body: newMessage,
      }),
    );
  }

  updateToolingCostLineMessage(
    toolingUid: string,
    messageId: string,
    messageUpdated: MessageUpdate,
  ) {
    return fromRequest(
      this.toolingService.updateToolingMessage({
        path: {
          uid: toolingUid,
          messageUid: messageId,
        },
        body: messageUpdated,
      }),
    );
  }

  deleteToolingCostLineMessage(toolingUid: string, messageId: string) {
    return fromRequest(
      this.toolingService.deleteToolingMessage({
        path: {
          uid: toolingUid,
          messageUid: messageId,
        },
      }),
    );
  }

  undoToolingCostLineMessage(toolingUid: string, messageId: string) {
    return fromRequest(
      this.toolingService.undoToolingMessage({
        path: {
          uid: toolingUid,
          messageUid: messageId,
        },
      }),
    );
  }
}
