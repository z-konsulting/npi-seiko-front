import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewChild,
} from "@angular/core";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import {
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
} from "../../../../client/costSeiko";
import { CostRequestTableComponent } from "../../../components/cost-request-table/cost-request-table.component";
import { CostRequestCardViewComponent } from "../../../components/cost-request-card-view/cost-request-card-view.component";
import { OverlayBadge } from "primeng/overlaybadge";
import { finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { ConfirmationService, PrimeTemplate } from "primeng/api";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { FileService } from "../../../services/file.service";
import { CostRequestService } from "../../../services/cost-request.service";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { environment } from "../../../../environments/environment";
import { ModalService } from "../../../services/components/modal.service";
import { Card } from "primeng/card";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { Popover } from "primeng/popover";

@Component({
  selector: "app-engineering-quotation",
  imports: [
    CostRequestTableComponent,
    CostRequestCardViewComponent,
    Button,
    TooltipModule,
    OverlayBadge,
    Card,
    CustomTitleComponent,
    PrimeTemplate,
    Popover,
  ],
  templateUrl: "./engineering-quotation.component.html",
  styleUrl: "./engineering-quotation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineeringQuotationComponent extends BaseListComponent {
  @ViewChild(CostRequestTableComponent)
  tableComponent!: CostRequestTableComponent;
  @ViewChild(CostRequestCardViewComponent)
  cardViewComponent!: CostRequestCardViewComponent;
  @ViewChild("bomImportPopover") bomImportPopover!: Popover;

  bomImportTargetCostRequest = signal<CostRequest | null>(null);
  viewMode = signal<"list" | "card">("list");
  isDownloadingStandardBom = signal<boolean>(false);
  protected costRequestService = inject(CostRequestService);
  protected costRequestRepo = inject(CostRequestRepo);
  protected costRequestLineRepo = inject(CostRequestLineRepo);
  protected modalService = inject(ModalService);
  protected readonly Icons = Icons;
  protected readonly statusFilter = [CostRequestStatus.READY_FOR_REVIEW];
  protected readonly RouteId = RouteId;
  private fileService = inject(FileService);
  private confirmationService = inject(ConfirmationService);
  private handleMessage = inject(HandleToastMessageService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ENGINEERING_QUOTATION);
  }

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

  editRfq(costRequest: CostRequest) {
    this.costRequestService
      .editRfq(costRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
  }

  openBomImportPopover(costRequest: CostRequest, event: Event): void {
    this.bomImportTargetCostRequest.set(costRequest);
    this.bomImportPopover.toggle(event);
  }

  importStandardBom(costRequest: CostRequest) {
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

  manageFilesForCostRequest(costRequest: CostRequest) {
    this.costRequestService
      .manageFilesForCostRequest(costRequest, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated !== undefined) this.refreshActiveView();
      });
  }

  manageFilesForLine(costRequest: CostRequest, line: CostRequestLine) {
    this.costRequestService
      .manageFilesForLine(costRequest, line, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated !== undefined) this.refreshActiveView();
      });
  }

  readyToEstimate(costRequest: CostRequest, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Ready to estimate for customer <strong>${costRequest.costRequestReferenceNumber} (Rev: ${costRequest.costRequestRevision})</strong>?`,
      header: "Ready to estimate",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: { label: "Ready to estimate" },
      accept: () => {
        this.costRequestRepo
          .validateCostRequestForEstimation(costRequest.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              setTimeout(() => {
                this.handleMessage.successMessage(
                  "Request for quotation is now ready for estimation",
                );
                this.refreshActiveView();
              }, 500);
            },
          });
      },
      reject: () => {},
    });
  }

  readyToEstimateLine(
    costRequest: CostRequest,
    line: CostRequestLine,
    event: any,
  ) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Ready to estimate line for customer P/N <strong>${line.customerPartNumber} - Rev ${line.customerPartNumberRevision}</strong>?`,
      header: "Ready to estimate line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: { label: "Ready to estimate" },
      accept: () => {
        this.costRequestLineRepo
          .validateCostRequestLineForEstimation(costRequest.uid, line.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              setTimeout(() => {
                this.handleMessage.successMessage(
                  "Line is now ready for estimation",
                );
                this.refreshActiveView();
              }, 500);
            },
          });
      },
      reject: () => {},
    });
  }

  deleteLine(costRequest: CostRequest, line: CostRequestLine, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete line <strong>${line.customerPartNumber} - ${line.customerPartNumberRevision}</strong>? This action cannot be undone.`,
      header: "Delete Line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
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
}
