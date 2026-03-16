import { inject, Injectable } from "@angular/core";
import { forkJoin, Observable, switchMap } from "rxjs";
import {
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
  FileInfo,
} from "../../client/costSeiko";
import { Icons } from "../models/enums/icons";
import { CostRequestRepo } from "../repositories/cost-request.repo";
import { ModalService } from "./components/modal.service";
import { environment } from "../../environments/environment";
import { CostRequestLineRepo } from "../repositories/cost-request-line.repo";

@Injectable({
  providedIn: "root",
})
export class CostRequestService {
  private costRequestRepo = inject(CostRequestRepo);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);

  // ── Icon/tooltip helpers ──────────────────────────────────────────────────
  /**
   * Check if the Cost Request or Line can be edited
   * Only editable when status is PENDING_INFORMATION
   */
  canEdit(status: CostRequestStatus): boolean {
    return (
      status === CostRequestStatus.PENDING_INFORMATION ||
      status === CostRequestStatus.READY_FOR_REVIEW
    );
  }

  /**
   * Check if files can be managed (added/deleted)
   * Only allowed when status is PENDING_INFORMATION
   */
  canManageFiles(status: CostRequestStatus): boolean {
    return this.canEdit(status);
  }

  /**
   * Check if lines can be added to a Cost Request
   * Only allowed when status is PENDING_INFORMATION
   */
  canAddLines(status: CostRequestStatus): boolean {
    return this.canEdit(status);
  }

  /**
   * Check if a line can be deleted
   * Only allowed in PENDING_INFORMATION or READY_FOR_REVIEW
   */
  canDeleteLine(status: CostRequestStatus): boolean {
    return this.canEdit(status);
  }

  /**
   * Check if a line can be aborted
   * Allowed at any time except when already ABORTED or QUOTED
   */
  canAbortLine(status: CostRequestStatus): boolean {
    return (
      status !== CostRequestStatus.PENDING_INFORMATION &&
      status !== CostRequestStatus.READY_FOR_REVIEW &&
      !this.isFinalized(status)
    );
  }

  /**
   * Check if Cost Request can be archived
   * Only allowed when status is QUOTED or ABORTED
   */
  canArchive(status: CostRequestStatus): boolean {
    return (
      status == CostRequestStatus.ACTIVE || status == CostRequestStatus.ABORTED
    );
  }

  /**
   * Check if Cost Request can be set to Ready to Review
   * Only allowed when status is PENDING_INFORMATION
   */
  canReadyForReview(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.PENDING_INFORMATION;
  }

  canSentToClient(status: CostRequestStatus): boolean {
    return this.isReadyToQuote(status);
  }

  /**
   * Check if Cost Request can be set to Ready to Estimate
   * Only allowed when status is READY_FOR_REVIEW
   */
  canReadyToEstimate(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.READY_FOR_REVIEW;
  }

  /**
   * Check if Cost Request can be aborted
   * Cannot abort if already QUOTED or ABORTED
   */
  canAbort(status: CostRequestStatus): boolean {
    return !this.isFinalized(status);
  }

  canRevertLineToReestimate(status: CostRequestStatus): boolean {
    return (
      status !== CostRequestStatus.PENDING_INFORMATION &&
      status !== CostRequestStatus.READY_FOR_REVIEW &&
      status !== CostRequestStatus.READY_TO_ESTIMATE &&
      !this.isFinalized(status)
    );
  }

  /**
   * Check if Cost Request can see estimation details
   */
  canSeeEstimationDetail(status: CostRequestStatus): boolean {
    return (
      status !== CostRequestStatus.PENDING_INFORMATION &&
      status !== CostRequestStatus.READY_TO_ESTIMATE &&
      status !== CostRequestStatus.READY_FOR_REVIEW &&
      status !== CostRequestStatus.READY_TO_VALIDATE &&
      status !== CostRequestStatus.ABORTED
    );
  }

  /**
   * Check if Cost Request can download breakdown
   */
  canDownloadBreakdown(status: CostRequestStatus): boolean {
    return (
      status !== CostRequestStatus.PENDING_INFORMATION &&
      status !== CostRequestStatus.READY_FOR_REVIEW &&
      status !== CostRequestStatus.READY_TO_VALIDATE &&
      status !== CostRequestStatus.ABORTED &&
      status !== CostRequestStatus.READY_TO_ESTIMATE
    );
  }

  /**
   * Check if is QUOTED
   */
  isReadyToQuote(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.READY_TO_QUOTE;
  }

  /**
   * Check if is ABORTED
   */
  isAborted(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.ABORTED;
  }

  /**
   * Check if is ACTIVE
   */
  isActive(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.ACTIVE;
  }

  /**
   * Check if is QUOTED
   */
  lineIs(status: CostRequestStatus): boolean {
    return status === CostRequestStatus.READY_TO_QUOTE;
  }

  /**
   * Check if the Cost Request/Line is in read-only mode
   * Read-only when status is NOT PENDING_INFORMATION
   */
  isReadOnly(status: CostRequestStatus): boolean {
    return !this.canEdit(status);
  }

  /**
   * Check if the Cost Request/Line is finalized
   * Finalized when status is ESTIMATED or ABORTED
   */
  isFinalized(status: CostRequestStatus): boolean {
    return (
      status === CostRequestStatus.WON ||
      status === CostRequestStatus.LOST ||
      status === CostRequestStatus.ACTIVE ||
      status === CostRequestStatus.NEW_REVISION_CREATED ||
      status === CostRequestStatus.ABORTED
    );
  }

  allDataFreezeStatus(status: CostRequestStatus) {
    return this.isFinalized(status);
  }

  canSeeOutsourcingProcurementColumn(status: CostRequestStatus): boolean {
    return (
      status !== CostRequestStatus.PENDING_INFORMATION &&
      status !== CostRequestStatus.READY_FOR_REVIEW &&
      status !== CostRequestStatus.READY_TO_ESTIMATE
    );
  }

  canOutsourceLine(status: CostRequestStatus): boolean {
    return status == CostRequestStatus.READY_TO_ESTIMATE;
  }

  getEditIcon(status: CostRequestStatus): string {
    return this.isReadOnly(status) ? Icons.EYE : Icons.PENCIL;
  }

  getEditTooltip(status: CostRequestStatus): string {
    return this.isReadOnly(status) ? "View" : "Edit";
  }

  getEditSeverity(
    status: CostRequestStatus,
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null {
    return this.isReadOnly(status) ? "success" : null;
  }

  // ── Cost request actions ──────────────────────────────────────────────────

  editRfq(costRequest: CostRequest): Observable<boolean | undefined> {
    return this.costRequestRepo
      .getCostRequest(costRequest.uid)
      .pipe(
        switchMap((retrieved) =>
          this.modalService.showCostRequestEditModal(
            retrieved,
            this.isReadOnly(costRequest.status),
          ),
        ),
      );
  }

  // ── Line actions ──────────────────────────────────────────────────────────

  addLine(costRequest: CostRequest): Observable<boolean | undefined> {
    return this.modalService.showCostRequestLineCreateEditModal(
      false,
      costRequest.uid,
      undefined,
      false,
      costRequest.status,
    );
  }

  editLine(
    costRequest: CostRequest,
    line: CostRequestLine,
  ): Observable<boolean | undefined> {
    return this.costRequestLineRepo
      .getCostRequestLine(costRequest.uid, line.uid)
      .pipe(
        switchMap((retrieved) =>
          this.modalService.showCostRequestLineCreateEditModal(
            true,
            costRequest.uid,
            retrieved,
            this.isReadOnly(line.status),
            costRequest.status,
          ),
        ),
      );
  }

  viewEstimationDetail(
    costRequest: CostRequest,
    line: CostRequestLine,
  ): Observable<boolean | undefined> {
    return forkJoin({
      retrieved: this.costRequestRepo.getCostRequest(costRequest.uid),
      retrievedLine: this.costRequestLineRepo.getCostRequestLine(
        costRequest.uid,
        line.uid,
      ),
    }).pipe(
      switchMap(({ retrieved, retrievedLine }) =>
        this.modalService.showEstimationDetailModal(retrieved, retrievedLine),
      ),
    );
  }

  manageMessages(
    costRequest: CostRequest,
    readOnly: boolean,
  ): Observable<unknown> {
    return this.modalService.showCostRequestMessageModal(
      costRequest.uid!,
      readOnly,
    );
  }

  // ── File actions ──────────────────────────────────────────────────────────

  manageFilesForCostRequest(
    costRequest: CostRequest,
    readOnly: boolean,
  ): Observable<FileInfo[] | undefined> {
    const url = `${environment.backendUrl}/cost-requests/${costRequest.uid}/files`;
    return this.costRequestRepo
      .getAllCostRequestFiles(costRequest.uid)
      .pipe(
        switchMap((files) =>
          this.modalService.showManageFileModal(url, files, readOnly, true),
        ),
      );
  }

  manageFilesForLine(
    costRequest: CostRequest,
    line: CostRequestLine,
    readOnly: boolean,
  ): Observable<FileInfo[] | undefined> {
    const url = `${environment.backendUrl}/cost-requests/${costRequest.uid}/lines/${line.uid}/files`;
    return this.costRequestLineRepo
      .getAllCostRequestLineFiles(costRequest.uid, line.uid)
      .pipe(
        switchMap((files) =>
          this.modalService.showManageFileModal(url, files, readOnly, true),
        ),
      );
  }

  manageLineMaterials(costRequest: CostRequest, line: CostRequestLine) {
    return this.costRequestLineRepo
      .retrieveCostLineMaterials(costRequest.uid, line.uid)
      .pipe(
        switchMap((materialLines) =>
          this.modalService.showMaterialLinesManageModal(
            costRequest,
            line,
            materialLines,
            !this.canEdit(line.status),
          ),
        ),
      );
  }

  public costRequestInfoForDialog(costRequest: CostRequest) {
    return `<strong>${costRequest.costRequestReferenceNumber} - Rev. ${costRequest.costRequestRevision}</strong>`;
  }
}
