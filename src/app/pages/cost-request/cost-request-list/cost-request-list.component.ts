import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
  ViewChild,
} from "@angular/core";
import { Popover } from "primeng/popover";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize, switchMap } from "rxjs";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { ModalService } from "../../../services/components/modal.service";
import {
  ArchivedFilter,
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
} from "../../../../client/costSeiko";
import { FormsModule } from "@angular/forms";
import { OverlayBadge } from "primeng/overlaybadge";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { environment } from "../../../../environments/environment";
import { FileService } from "../../../services/file.service";
import { SelectButton } from "primeng/selectbutton";
import { CostRequestTableComponent } from "../../../components/cost-request-table/cost-request-table.component";
import { CostRequestCardViewComponent } from "../../../components/cost-request-card-view/cost-request-card-view.component";
import { ConfirmationService } from "primeng/api";
import { TableModule } from "primeng/table";
import { CostRequestService } from "../../../services/cost-request.service";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { LoaderService } from "../../../services/components/loader.service";
import { Card } from "primeng/card";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";

@Component({
  selector: "app-cost-request-list",
  imports: [
    CostRequestTableComponent,
    CostRequestCardViewComponent,
    Button,
    TooltipModule,
    FormsModule,
    OverlayBadge,
    SelectButton,
    TableModule,
    Card,
    CustomTitleComponent,
    Popover,
    NoDoubleClickDirective,
  ],
  templateUrl: "./cost-request-list.component.html",
  styleUrl: "./cost-request-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestListComponent {
  @ViewChild(CostRequestTableComponent)
  tableComponent!: CostRequestTableComponent;
  @ViewChild(CostRequestCardViewComponent)
  cardViewComponent!: CostRequestCardViewComponent;
  @ViewChild("bomImportPopover") bomImportPopover!: Popover;
  @ViewChild("reestimatePopover") reestimatePopover!: Popover;

  bomImportTargetCostRequest = signal<CostRequest | null>(null);
  reestimateTargetLine = signal<{
    costRequest: CostRequest;
    line: CostRequestLine;
  } | null>(null);

  // View mode
  viewMode = signal<"list" | "card">("list");

  // Shared search/page state persisted across view switches
  sharedSearch = signal<string>("");
  sharedCardPage = signal<number>(0);

  // Clone mode state
  cloneMode = signal<boolean>(false);
  cloneCostRequestUid = signal<string | null>(null);
  selectedLinesForClone = signal<CostRequestLine[]>([]);
  // Loading states
  loadingReadyForReviewUid = signal<string | null>(null);
  loadingCloneUid = signal<string | null>(null);
  isDownloadingStandardBom = signal<boolean>(false);

  // Archived filter state
  archivedFilter = signal<ArchivedFilter>(ArchivedFilter.NON_ARCHIVED_ONLY);
  archivedFilterOptions = [
    { label: "Active", value: ArchivedFilter.NON_ARCHIVED_ONLY },
    { label: "Archived", value: ArchivedFilter.ARCHIVED_ONLY },
  ];

  title = RoutingService.getRouteTitle(RouteId.QUOTATION);
  protected readonly Icons = Icons;
  protected readonly CostRequestStatus = CostRequestStatus;
  protected costRequestService = inject(CostRequestService);
  protected readonly RouteId = RouteId;
  private costRequestRepo = inject(CostRequestRepo);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private confirmationService = inject(ConfirmationService);
  private handleMessage = inject(HandleToastMessageService);
  private fileService = inject(FileService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private loadService = inject(LoaderService);

  refreshActiveView(): void {
    if (this.viewMode() === "card") {
      this.cardViewComponent?.refresh();
    } else {
      this.tableComponent?.refresh();
    }
  }

  downloadStandardBom() {
    this.isDownloadingStandardBom.set(true);
    this.costRequestRepo
      .downloadStandardBom()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDownloadingStandardBom.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.fileService.downloadFile(
            response.body,
            response,
            "standard-bom.xlsx",
          );
        },
      });
  }

  openBomImportPopover(costRequest: CostRequest, event: Event): void {
    this.bomImportTargetCostRequest.set(costRequest);
    this.bomImportPopover.toggle(event);
  }

  importStandardBom(costRequest: CostRequest) {
    this.bomImportPopover.hide();
    const header = `Import standard BOM`;
    const uploadUrl = `${environment.backendUrl}/cost-requests/${costRequest.uid}/standard-bom/import`;
    this.modalService
      .showOnlyUploadModal(header, uploadUrl, true, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshActiveView();
      });
  }

  importCustomBom(costRequest: CostRequest): void {
    this.bomImportPopover.hide();
    this.modalService
      .showCustomBomImportModal(costRequest.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((imported) => {
        if (imported) this.refreshActiveView();
      });
  }

  onArchivedFilterChange(newFilter: ArchivedFilter) {
    this.archivedFilter.set(newFilter);
  }

  isArchivedMode(): boolean {
    return this.archivedFilter() === ArchivedFilter.ARCHIVED_ONLY;
  }

  createCostRequest() {
    if (this.cloneMode()) {
      this.cancelClone();
    }
    this.modalService
      .showCostRequestCreateModal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.refreshActiveView();
        }
      });
  }

  editRfq(costRequest: CostRequest) {
    this.costRequestService
      .editRfq(costRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
  }

  addLine(costRequest: CostRequest) {
    this.costRequestService
      .addLine(costRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) this.refreshActiveView();
      });
  }

  editLine(costRequest: CostRequest, line: CostRequestLine) {
    this.costRequestService
      .editLine(costRequest, line)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
  }

  viewEstimationDetail(costRequest: CostRequest, line: CostRequestLine) {
    this.costRequestService
      .viewEstimationDetail(costRequest, line)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
  }

  manageFilesForCostRequest(costRequest: CostRequest) {
    const readOnly =
      this.isArchivedMode() ||
      this.costRequestService.isReadOnly(costRequest.status);
    this.costRequestService
      .manageFilesForCostRequest(costRequest, readOnly)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated !== undefined) this.refreshActiveView();
      });
  }

  manageFilesForLine(costRequest: CostRequest, line: CostRequestLine) {
    const readOnly =
      this.isArchivedMode() || this.costRequestService.isReadOnly(line.status);
    this.costRequestService
      .manageFilesForLine(costRequest, line, readOnly)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated !== undefined) this.refreshActiveView();
      });
  }

  manageLineMaterials(costRequest: CostRequest, line: CostRequestLine) {
    this.costRequestService
      .manageLineMaterials(costRequest, line)
      .subscribe(() => this.refreshActiveView());
  }

  manageMessages(costRequest: CostRequest) {
    this.costRequestService
      .manageMessages(
        costRequest,
        !this.costRequestService.canEdit(costRequest.status),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
  }

  cloneCostRequest(costRequest: CostRequest) {
    if (costRequest.lines?.length === 1) {
      this.costRequestRepo
        .cloneCostRequest(costRequest.uid, [costRequest.lines[0].uid])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage(
              "Request for quotation cloned successfully",
            );
            this.refreshActiveView();
          },
        });
      return;
    }

    this.cloneMode.set(true);
    this.cloneCostRequestUid.set(costRequest.uid);
    this.selectedLinesForClone.set([]);

    if (this.tableComponent) {
      this.tableComponent.expandedRows = {};
      this.tableComponent.expandedRows[costRequest.uid] = true;
    }
    this.handleMessage.infoMessage("Please select the lines to clone");
    this.cdr.detectChanges();
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async confirmClone() {
    if (this.selectedLinesForClone().length === 0) {
      this.handleMessage.warningMessage(
        "Please select at least one line to clone",
      );
      return;
    }
    this.loadingCloneUid.set(this.cloneCostRequestUid());
    const lineUids = this.selectedLinesForClone().map((line) => line.uid);
    this.costRequestRepo
      .cloneCostRequest(this.cloneCostRequestUid()!, lineUids)
      .pipe(
        finalize(() => this.loadingCloneUid.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation cloned successfully",
          );
          this.cancelClone();
          this.refreshActiveView();
        },
      });
  }

  cancelClone() {
    this.cloneMode.set(false);
    this.cloneCostRequestUid.set(null);
    this.selectedLinesForClone.set([]);
  }

  isInCloneMode(costRequestUid: string): boolean {
    return this.cloneMode() && this.cloneCostRequestUid() === costRequestUid;
  }

  archiveCostRequest(costRequest: CostRequest, event: any) {
    if (costRequest.status === CostRequestStatus.ACTIVE) {
      this.modalService
        .showArchiveActiveCostRequestModal(costRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (!result) return;
          if (result.decision === "won") {
            this.costRequestRepo
              .costRequestApprovedByCustomer(costRequest.uid)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.handleMessage.successMessage(
                    "Quotation marked as WON — approved by customer",
                  );
                  this.refreshActiveView();
                },
              });
          } else if (result.decision === "lost") {
            this.costRequestRepo
              .costRequestRejectedByCustomer(costRequest.uid, {
                reason: result.reason,
              })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.handleMessage.successMessage(
                    "Quotation marked as LOST — rejected by customer",
                  );
                  this.refreshActiveView();
                },
              });
          } else if (result.decision === "new-revision-created") {
            this.costRequestRepo
              .createdNewRevisionOfCostRequest(costRequest.uid)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.handleMessage.successMessage(
                    "Quotation archived — a new revision was created",
                  );
                  this.refreshActiveView();
                },
              });
          }
        });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to archive request for quotation ${costRequest.costRequestReferenceNumber} (Rev: ${costRequest.costRequestRevision})?`,
      header: "Archive Request for quotation",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: { label: "No", outlined: true },
      accept: () => {
        this.costRequestRepo
          .archiveCostRequest(costRequest.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage(
                "Request for quotation archived",
              );
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  abortCostRequest(costRequest: CostRequest, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to abort request for quotation <strong>${costRequest.costRequestReferenceNumber} (Rev: ${costRequest.costRequestRevision})</strong>? This action cannot be undone.`,
      header: "Abort Request for quotation",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: {
        label: "Abort",
      },
      accept: () => {
        this.costRequestRepo
          .abortCostRequest(costRequest.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage(
                "Request for quotation aborted",
              );
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  revertCostRequestLineToReestimate(
    costRequest: CostRequest,
    line: CostRequestLine,
    event: any,
  ) {
    this.reestimateTargetLine.set({ costRequest, line });
    this.reestimatePopover.show(event);
  }

  confirmRevertToStatus(status: CostRequestStatus): void {
    const target = this.reestimateTargetLine();
    if (!target) return;
    this.reestimatePopover.hide();
    this.costRequestLineRepo
      .revertCostRequestLineForReestimation(
        target.costRequest.uid,
        target.line.uid,
        status,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation line reverted to reestimate",
          );
          this.reestimateTargetLine.set(null);
          this.refreshActiveView();
        },
      });
  }

  createNewRevision(costRequest: CostRequest, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to create a new revision of request for quotation ${costRequest.costRequestReferenceNumber} (Rev: ${costRequest.costRequestRevision})?`,
      header: "Create New Revision",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: { label: "No", outlined: true },
      accept: () => {
        this.costRequestRepo
          .createNewRevisionCostRequest(costRequest.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("New revision created");
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  deleteLine(costRequest: CostRequest, line: CostRequestLine, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete line ${line.customerPartNumber} - ${line.customerPartNumberRevision}? This action cannot be undone.`,
      header: "Delete Line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: { label: "No", outlined: true },
      accept: () => {
        this.costRequestLineRepo
          .deleteCostRequestLine(costRequest.uid, line.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("Line deleted");
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  abortLine(costRequest: CostRequest, line: CostRequestLine, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Abort line <strong>${line.customerPartNumber} - ${line.customerPartNumberRevision}</strong>"? This action cannot be undone.`,
      header: "Abort Line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: { label: "Abort" },
      accept: () => {
        this.costRequestLineRepo
          .abortCostRequestLine(costRequest.uid, line.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("Line aborted");
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  getEditIcon(status: CostRequestStatus): string {
    return this.costRequestService.getEditIcon(status);
  }

  getEditTooltip(status: CostRequestStatus): string {
    return this.costRequestService.getEditTooltip(status);
  }

  getEditSeverity(
    status: CostRequestStatus,
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null {
    return this.costRequestService.getEditSeverity(status);
  }

  extendExpiration(costRequest: CostRequest) {
    this.modalService
      .showExtendExpirationModal(costRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newExpirationDate) => {
        if (!newExpirationDate) return;
        this.costRequestRepo
          .extendCostRequestExpiration(costRequest.uid, { newExpirationDate })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage(
                "Expiration date extended successfully",
              );
              this.refreshActiveView();
            },
          });
      });
  }

  generateCostRequestPdf(costRequest: CostRequest) {
    if (
      !this.costRequestService.isAborted(costRequest.status) &&
      this.costRequestService.isFinalized(costRequest.status)
    ) {
      this.costRequestRepo
        .downloadQuotationPdf(costRequest.uid)
        .pipe(
          finalize(() => setTimeout(() => this.loadService.hideLoader(), 500)),
        )
        .subscribe({
          next: (response) => {
            if (response)
              this.fileService.downloadFile(response.body, response, "");
          },
        });
      return;
    }
    this.modalService
      .showGenerateQuotationPdfModal(costRequest)
      .pipe(
        switchMap((body) => {
          if (!body) return [];
          this.loadService.showLoader("Generating quote...");
          return this.costRequestRepo
            .generateCostRequestPdf(costRequest.uid, body)
            .pipe(
              finalize(() =>
                setTimeout(() => this.loadService.hideLoader(), 500),
              ),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.fileService.downloadFile(response.body, response, "");
            this.tableComponent?.refresh();
          }
        },
      });
  }

  downloadQuotationBreakdown(costRequest: CostRequest, lineUid: string) {
    this.loadService.showLoader("Downloading quote breakdown...");
    this.costRequestLineRepo
      .downloadQuotationBreakdown(costRequest.uid, lineUid)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(() => this.loadService.hideLoader(), 500);
        }),
      )
      .subscribe({
        next: (response) => {
          if (response)
            this.fileService.downloadFile(response.body, response, "");
        },
      });
  }

  readyForReview(costRequest: CostRequest, event: any) {
    this.loadingReadyForReviewUid.set(costRequest.uid);
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Ready to start review for request for quotation <strong>${costRequest.costRequestReferenceNumber} (Rev: ${costRequest.costRequestRevision})</strong>?"`,
      header: "Ready for review",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: { label: "Ready for review" },
      accept: () => {
        this.costRequestRepo
          .validateCostRequestForReview(costRequest.uid)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() =>
              setTimeout(() => this.loadingReadyForReviewUid.set(null), 500),
            ),
          )
          .subscribe({
            next: () => {
              setTimeout(() => {
                this.handleMessage.successMessage(
                  "Request for quotation validated for review",
                );
                this.refreshActiveView();
              }, 500);
            },
          });
      },
      reject: () => {
        this.loadingReadyForReviewUid.set(null);
      },
    });
  }
}
