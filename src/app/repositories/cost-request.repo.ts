import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import {
  ArchivedFilter,
  CostRequest,
  CostRequest2 as CostRequestSDK,
  CostRequestCreate,
  CostRequestExtendExpiration,
  CostRequestsPaginated,
  CostRequestStatus,
  CostRequestUpdate,
  CustomBomImportBody,
  GenerateQuotationPdfBody,
  MessageCreate,
  MessageUpdate,
  RejectBody,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";
import { HttpOptions } from "./helpers/HttpOptions";

@Injectable({
  providedIn: "root",
})
export class CostRequestRepo {
  private http = inject(HttpClient);
  private costRequestPath = `${environment.backendUrl}/cost-requests`;

  constructor(private costRequestService: CostRequestSDK) {}

  // ============================================
  // COST REQUESTS
  // ============================================
  getCostRequestSubstituteMaterialsComment(costRequestUid: string) {
    return fromRequest(
      this.costRequestService.getCostRequestSubstituteMaterialsComment({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  costRequestApprovedByCustomer(costRequestUid: string) {
    return fromRequest(
      this.costRequestService.costRequestApprovedByCustomer({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  costRequestRejectedByCustomer(costRequestUid: string, body: RejectBody) {
    return fromRequest(
      this.costRequestService.costRequestRejectedByCustomer({
        path: {
          uid: costRequestUid,
        },
        body,
      }),
    );
  }

  createdNewRevisionOfCostRequest(costRequestUid: string) {
    return fromRequest(
      this.costRequestService.createdNewRevisionOfCostRequest({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  exportArchivedCostRequests(startDate: string, endDate: string) {
    const url = `${this.costRequestPath}/archived/export`;
    let httpOptions = HttpOptions.buildHttpOptions(
      {
        startDate,
        endDate,
      },
      {
        Accept: "application/json",
      },
    );
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: httpOptions.headers,
      params: httpOptions.params,
    });
  }

  exportOpenCostRequests() {
    const url = `${this.costRequestPath}/open/export`;
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  uploadCustomBom(uid: string, body: CustomBomImportBody): Observable<unknown> {
    return fromRequest(
      this.costRequestService.uploadCostRequestCustomBom({
        path: { uid },
        body,
      }),
    );
  }

  downloadStandardBom() {
    const url = `${this.costRequestPath}/standard-bom/download`;
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  generateCostRequestPdf(uid: string, body: GenerateQuotationPdfBody) {
    const url = `${this.costRequestPath}/${uid}/generate-quotation-pdf`;
    return this.http.post(url, body, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  downloadQuotationPdf(uid: string) {
    const url = `${this.costRequestPath}/${uid}/download-quotation-pdf`;
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  searchCostRequests(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
    archivedFilter: ArchivedFilter = ArchivedFilter.NON_ARCHIVED_ONLY,
    statuses: CostRequestStatus[] = [],
    lineStatuses: CostRequestStatus[] = [],
  ): Observable<CostRequestsPaginated> {
    return fromRequest(
      this.costRequestService.searchCostRequests({
        body: {
          searchText: search ?? "",
          costRequestAcceptedStatuses: statuses,
          costRequestLineAcceptedStatuses: lineStatuses,
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
          archivedFilter: archivedFilter,
        },
      }),
    );
  }

  searchEngineeringCostRequests(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
    archivedFilter: ArchivedFilter = ArchivedFilter.NON_ARCHIVED_ONLY,
    statuses: CostRequestStatus[] = [],
    lineStatuses: CostRequestStatus[] = [],
  ): Observable<CostRequestsPaginated> {
    return fromRequest(
      this.costRequestService.searchEngineeringCostRequests({
        body: {
          searchText: search ?? "",
          costRequestAcceptedStatuses: statuses,
          costRequestLineAcceptedStatuses: lineStatuses,
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
          archivedFilter: archivedFilter,
        },
      }),
    );
  }

  getCostRequest(costRequestUid: string): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.retrieveCostRequest({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  createCostRequest(
    costRequestCreate: CostRequestCreate,
  ): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.createCostRequest({
        body: costRequestCreate,
      }),
    );
  }

  updateCostRequest(
    costRequestUid: string,
    costRequestUpdate: CostRequestUpdate,
  ): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.updateCostRequest({
        body: costRequestUpdate,
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  cloneCostRequest(
    costRequestUid: string,
    lineUids: string[],
  ): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.cloneCostRequest({
        body: {
          lineUids: lineUids,
        },
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  archiveCostRequest(costRequestUid: string): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.archiveCostRequest({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  extendCostRequestExpiration(
    costRequestUid: string,
    body: CostRequestExtendExpiration,
  ) {
    return fromRequest(
      this.costRequestService.extendCostRequestExpiration({
        path: { uid: costRequestUid },
        body,
      }),
    );
  }

  abortCostRequest(costRequestUid: string): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.abortCostRequest({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  createNewRevisionCostRequest(
    costRequestUid: string,
  ): Observable<CostRequest> {
    return fromRequest(
      this.costRequestService.createNewRevisionCostRequest({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  validateCostRequestForReview(costRequestUid: string): Observable<any> {
    return fromRequest(
      this.costRequestService.validateCostRequestForReview({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  validateCostRequestForEstimation(costRequestUid: string): Observable<any> {
    return fromRequest(
      this.costRequestService.validateCostRequestForEstimation({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  // ============================================
  // FILES
  // ============================================

  getAllCostRequestFiles(costRequestUid: string): Observable<any[]> {
    return fromRequest(
      this.costRequestService.getAllCostRequestFiles({
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  // ============================================
  // MESSAGES
  // ============================================

  getAllCostRequestMessages(objectId: string) {
    return fromRequest(
      this.costRequestService.getAllCostRequestMessages({
        path: {
          uid: objectId,
        },
      }),
    );
  }

  createCostRequestMessage(objectId: string, newMessage: MessageCreate) {
    return fromRequest(
      this.costRequestService.createCostRequestMessage({
        path: {
          uid: objectId,
        },
        body: newMessage,
      }),
    );
  }

  updateCostRequestMessage(
    objectId: string,
    messageId: string,
    messageUpdated: MessageUpdate,
  ) {
    return fromRequest(
      this.costRequestService.updateCostRequestMessage({
        path: {
          uid: objectId,
          messageUid: messageId,
        },
        body: messageUpdated,
      }),
    );
  }

  deleteCostRequestMessage(objectId: string, messageId: string) {
    return fromRequest(
      this.costRequestService.deleteCostRequestMessage({
        path: {
          uid: objectId,
          messageUid: messageId,
        },
      }),
    );
  }

  undoCostRequestMessage(objectId: string, messageId: string) {
    return fromRequest(
      this.costRequestService.undoCostRequestMessage({
        path: {
          uid: objectId,
          messageUid: messageId,
        },
      }),
    );
  }
}
