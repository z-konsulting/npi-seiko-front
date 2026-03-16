import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
  CostRequestLine,
  CostRequestLine2 as CostRequestLineSDK,
  CostRequestLineCostingPerQuantity,
  CostRequestLineCreate,
  CostRequestLineEstimate,
  CostRequestLineReject,
  CostRequestLineUpdate,
  CostRequestStatus,
  CustomCostRequestLine,
  CustomCostRequestLinesPaginated,
  EstimationDetailsPerShipmentToCustomer,
  FileInfo,
  MaterialCostLine,
  MaterialCostLineCreate,
  MaterialCostLineSupplierUpdate,
  MaterialCostLineUpdate,
  MaterialSubstituteCreate,
  MessageCreate,
  MessageUpdate,
  OtherCostLine,
  OtherCostLineCreate,
  ProcessCostLine,
  ProcessCostLineCreate,
  ProcessCostLineUpdate,
  RejectBody as RejectApprovalBody,
  ToolingCostLine,
  ToolingCostLineCreate,
  ToolingStrategy,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class CostRequestLineRepo {
  private http = inject(HttpClient);
  private costRequestPath = `${environment.backendUrl}/cost-requests`;

  constructor(private costRequestLineService: CostRequestLineSDK) {}

  // ============================================
  // PROCUREMENT — LINES TO BE ESTIMATED
  // ============================================

  downloadQuotationBreakdown(uid: string, lineUid: string) {
    const url = `${this.costRequestPath}/${uid}/lines/${lineUid}/download-quotation-breakdown`;
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  validateCostRequestLineForEstimation(
    costRequestUid: string,
    lineUid: string,
  ) {
    return fromRequest(
      this.costRequestLineService.validateCostRequestLineForEstimation({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  revertCostRequestLineForReestimation(
    uid: string,
    lineUid: string,
    costRequestStatus: CostRequestStatus,
  ) {
    return fromRequest(
      this.costRequestLineService.revertCostRequestLineForReestimation({
        path: { uid, lineUid },
        query: { costRequestStatus },
      }),
    );
  }

  searchToBeEstimated(
    offset: number,
    limit: number,
    search?: string,
  ): Observable<CustomCostRequestLinesPaginated> {
    return fromRequest(
      this.costRequestLineService.searchCostRequestLinesToBeEstimated({
        body: { searchText: search ?? "" },
        query: { offset, limit },
      }),
    );
  }

  estimateLine(uid: string, body: CostRequestLineEstimate) {
    return fromRequest(
      this.costRequestLineService.estimateCostRequestLine({
        path: { uid },
        body,
      }),
    );
  }

  rejectLine(uid: string, body: CostRequestLineReject) {
    return fromRequest(
      this.costRequestLineService.rejectCostRequestLine({
        path: { uid },
        body,
      }),
    );
  }

  createCostRequestLine(
    costRequestUid: string,
    lineCreate: CostRequestLineCreate,
  ): Observable<CostRequestLine> {
    return fromRequest(
      this.costRequestLineService.createCostRequestLine({
        body: lineCreate,
        path: {
          uid: costRequestUid,
        },
      }),
    );
  }

  getCostRequestLine(
    costRequestUid: string,
    lineUid: string,
  ): Observable<CostRequestLine> {
    return fromRequest(
      this.costRequestLineService.retrieveCostRequestLine({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  updateCostRequestLine(
    costRequestUid: string,
    lineUid: string,
    lineUpdate: CostRequestLineUpdate,
  ): Observable<CostRequestLine> {
    return fromRequest(
      this.costRequestLineService.updateCostRequestLine({
        body: lineUpdate,
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  validateEstimationCostRequestLine(costRequestUid: string, lineUid: string) {
    return fromRequest(
      this.costRequestLineService.validateEstimationCostRequestLine({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  deleteCostRequestLine(
    costRequestUid: string,
    lineUid: string,
  ): Observable<unknown> {
    return fromRequest(
      this.costRequestLineService.deleteCostRequestLine({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  abortCostRequestLine(
    costRequestUid: string,
    lineUid: string,
  ): Observable<CostRequestLine> {
    return fromRequest(
      this.costRequestLineService.abortCostRequestLine({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  validateLineForReadyForMarkup(
    costRequestUid: string,
    lineUid: string,
  ): Observable<unknown> {
    return fromRequest(
      this.costRequestLineService.validateForReadyForMarkupCostRequestLine({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  // ============================================
  // MANAGEMENT
  // ============================================

  listPendingApprovalLines(): Observable<CustomCostRequestLine[]> {
    return fromRequest(
      this.costRequestLineService.listOfAllCostRequestLinesPendingApproval(),
    );
  }

  approvePriceByManagement(
    costRequestUid: string,
    lineUid: string,
  ): Observable<any> {
    return fromRequest(
      this.costRequestLineService.approveCostRequestLinePriceByManagement({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  rejectPriceByManagement(
    costRequestUid: string,
    lineUid: string,
    body: RejectApprovalBody,
  ) {
    return fromRequest(
      this.costRequestLineService.rejectCostRequestLinePriceByManagement({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
        body,
      }),
    );
  }

  // ============================================
  // PLANNING
  // ============================================

  searchPlanningLines(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<CustomCostRequestLinesPaginated> {
    return fromRequest(
      this.costRequestLineService.searchCostRequestLinesForPlanning({
        body: { searchText: search ?? "" },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
        },
        path: { uid: "", lineUid: "" },
      }),
    );
  }

  exportProductionBom(costRequestUid: string, lineUid: string) {
    const url = `${this.costRequestPath}/${costRequestUid}/lines/${lineUid}/production-bom/export`;
    return this.http.post(url, null, {
      responseType: "blob",
      observe: "response",
      headers: new HttpHeaders({
        Accept: "application/json",
      }),
    });
  }

  setCostRequestLineMarkup(
    costRequestUid: string,
    lineUid: string,
    markup: number,
    currencyCode: string,
  ): Observable<EstimationDetailsPerShipmentToCustomer[]> {
    return fromRequest(
      this.costRequestLineService.setCostRequestLineMarkup({
        body: { markup },
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
        query: { currencyCode },
      }),
    );
  }

  setToolingStrategy(
    costRequestUid: string,
    lineUid: string,
    strategy: ToolingStrategy,
  ): Observable<CostRequestLine> {
    return fromRequest(
      this.costRequestLineService.setCostRequestLineToolingStrategy({
        body: { strategy },
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  setToolingMarkup(
    costRequestUid: string,
    lineUid: string,
    markup: number,
    currencyCode: string,
  ): Observable<EstimationDetailsPerShipmentToCustomer[]> {
    return fromRequest(
      this.costRequestLineService.setCostRequestLineToolingMarkup({
        body: { markup },
        path: { uid: costRequestUid, lineUid },
        query: { currencyCode },
      }),
    );
  }

  validateCostRequestLinePrice(
    costRequestUid: string,
    lineUid: string,
  ): Observable<any> {
    return fromRequest(
      this.costRequestLineService.validateCostRequestLinePrice({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  // ============================================
  // COST REQUEST LINE COSTING
  // ============================================

  getCostRequestLineCosting(
    costRequestUid: string,
    lineUid: string,
  ): Observable<CostRequestLineCostingPerQuantity[]> {
    return fromRequest(
      this.costRequestLineService.retrieveCostRequestLineCosting({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  // ============================================
  // PROCESS COST LINES
  // ============================================

  createProcessCostLine(
    costRequestUid: string,
    lineUid: string,
    body: ProcessCostLineCreate,
  ): Observable<ProcessCostLine[]> {
    return fromRequest(
      this.costRequestLineService.createProcessCostLine({
        body,
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  updateProcessCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: ProcessCostLineUpdate,
  ): Observable<ProcessCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateProcessCostLine({
        body,
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  deleteProcessCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<ProcessCostLine[]> {
    return fromRequest(
      this.costRequestLineService.deleteProcessCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  // ============================================
  // TOOLING COST LINES
  // ============================================

  createToolingCostLine(
    costRequestUid: string,
    lineUid: string,
    body: ToolingCostLineCreate,
  ): Observable<ToolingCostLine[]> {
    return fromRequest(
      this.costRequestLineService.createToolingCostLine({
        body,
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  updateToolingCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: ToolingCostLineCreate,
  ): Observable<ToolingCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateToolingCostLine({
        body,
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  deleteToolingCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<ToolingCostLine[]> {
    return fromRequest(
      this.costRequestLineService.deleteToolingCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  outsourceLine(
    costRequestUid: string,
    lineUid: string,
  ): Observable<CostRequestLine[]> {
    return fromRequest(
      this.costRequestLineService.outsourceCostRequestLine({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  outsourceToolingCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<ToolingCostLine[]> {
    return fromRequest(
      this.costRequestLineService.outsourceToolingCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  getAllToolingCostLineFiles(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<FileInfo[]> {
    return fromRequest(
      this.costRequestLineService.getAllToolingCostLineFilesMetadata({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  // ============================================
  // MATERIAL COST LINES
  // ============================================

  createMaterialCostLine(
    costRequestUid: string,
    lineUid: string,
    body: MaterialCostLineCreate,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.createMaterialCostLine({
        body,
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  updateMaterialCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: MaterialCostLineUpdate,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateMaterialCostLine({
        body,
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  deleteMaterialCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.deleteMaterialCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  markOrUnmarkUsedMaterialCostLineForQuote(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.markOrUnmarkUsedMaterialCostLineForQuote({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  retrieveCostLineMaterials(
    costRequestUid: string,
    lineUid: string,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.retrieveCostLineMaterials({
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  retrieveMaterialSubstitute(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<MaterialCostLine> {
    return fromRequest(
      this.costRequestLineService.retrieveMaterialLineMaterialSubstitute({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  createMaterialSubstitute(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: MaterialSubstituteCreate,
  ): Observable<MaterialCostLine> {
    return fromRequest(
      this.costRequestLineService.createMaterialSubstituteMaterialLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
        body,
      }),
    );
  }

  deleteMaterialSubstitute(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<MaterialCostLine> {
    return fromRequest(
      this.costRequestLineService.deleteMaterialSubstituteMaterialLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  // ============================================
  // OTHER COST LINES
  // ============================================

  createOtherCostLine(
    costRequestUid: string,
    lineUid: string,
    body: OtherCostLineCreate,
  ): Observable<OtherCostLine[]> {
    return fromRequest(
      this.costRequestLineService.createOtherCostLine({
        body,
        path: { uid: costRequestUid, lineUid },
      }),
    );
  }

  updateOtherCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: OtherCostLineCreate,
  ): Observable<OtherCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateOtherCostLine({
        body,
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  maskUnmaskOtherCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<OtherCostLine[]> {
    return fromRequest(
      this.costRequestLineService.maskUnmaskOtherCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  deleteOtherCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
  ): Observable<OtherCostLine[]> {
    return fromRequest(
      this.costRequestLineService.deleteOtherCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
      }),
    );
  }

  // ============================================
  // FILES
  // ============================================

  getAllCostRequestLineFiles(
    costRequestUid: string,
    lineUid: string,
  ): Observable<any[]> {
    return fromRequest(
      this.costRequestLineService.getAllCostRequestLineFiles({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
      }),
    );
  }

  getEstimationDetails(
    costRequestUid: string,
    lineUid: string,
    currencyCode: string,
  ): Observable<EstimationDetailsPerShipmentToCustomer[]> {
    return fromRequest(
      this.costRequestLineService.retrieveEstimationDetails({
        path: {
          uid: costRequestUid,
          lineUid: lineUid,
        },
        query: {
          currencyCode,
        },
      }),
    );
  }

  // ============================================
  // MESSAGES
  // ============================================

  getAllCostRequestMessages(objectId: string, lineUid: string) {
    return fromRequest(
      this.costRequestLineService.getAllCostRequestLineMessages({
        path: {
          uid: objectId,
          lineUid: lineUid,
        },
      }),
    );
  }

  createCostRequestLineMessage(
    objectId: string,
    lineUid: string,
    newMessage: MessageCreate,
  ) {
    return fromRequest(
      this.costRequestLineService.createCostRequestLineMessage({
        path: {
          uid: objectId,
          lineUid: lineUid,
        },
        body: newMessage,
      }),
    );
  }

  updateCostRequestLineMessage(
    objectId: string,
    lineUid: string,
    messageId: string,
    messageUpdated: MessageUpdate,
  ) {
    return fromRequest(
      this.costRequestLineService.updateCostRequestLineMessage({
        path: {
          uid: objectId,
          lineUid: lineUid,
          messageUid: messageId,
        },
        body: messageUpdated,
      }),
    );
  }

  deleteCostRequestLineMessage(
    objectId: string,
    lineUid: string,
    messageId: string,
  ) {
    return fromRequest(
      this.costRequestLineService.deleteCostRequestLineMessage({
        path: {
          uid: objectId,
          lineUid: lineUid,
          messageUid: messageId,
        },
      }),
    );
  }

  undoCostRequestLineMessage(
    objectId: string,
    lineUid: string,
    messageId: string,
  ) {
    return fromRequest(
      this.costRequestLineService.undoCostRequestLineMessage({
        path: {
          uid: objectId,
          lineUid: lineUid,
          messageUid: messageId,
        },
      }),
    );
  }

  updateSupplierForMaterialCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: MaterialCostLineSupplierUpdate,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateSupplierForMaterialCostLine({
        path: { uid: costRequestUid, lineUid, costingLineUid },
        body,
      }),
    );
  }

  updateSupplierForSubstituteOfMaterialCostLine(
    costRequestUid: string,
    lineUid: string,
    costingLineUid: string,
    body: MaterialCostLineSupplierUpdate,
  ): Observable<MaterialCostLine[]> {
    return fromRequest(
      this.costRequestLineService.updateSupplierForSubstituteOfMaterialCostLine(
        {
          path: { uid: costRequestUid, lineUid, costingLineUid },
          body,
        },
      ),
    );
  }
}
