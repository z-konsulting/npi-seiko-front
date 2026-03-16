import {
  ChangeDetectionStrategy,
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
import { ModalService } from "../../../services/components/modal.service";
import {
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
  OutsourcingStatus,
} from "../../../../client/costSeiko";
import { finalize } from "rxjs";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ConfirmationService, PrimeTemplate } from "primeng/api";
import { CostRequestTableComponent } from "../../../components/cost-request-table/cost-request-table.component";
import { CostRequestCardViewComponent } from "../../../components/cost-request-card-view/cost-request-card-view.component";
import { CostRequestService } from "../../../services/cost-request.service";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { OverlayBadge } from "primeng/overlaybadge";
import { Card } from "primeng/card";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";

@Component({
  selector: "app-engineering-costing",
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
  templateUrl: "./engineering-costing.component.html",
  styleUrl: "./engineering-costing.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineeringCostingComponent {
  @ViewChild(CostRequestTableComponent)
  tableComponent!: CostRequestTableComponent;
  @ViewChild(CostRequestCardViewComponent)
  cardViewComponent!: CostRequestCardViewComponent;
  @ViewChild("reestimatePopover") reestimatePopover!: Popover;

  reestimateTargetLine = signal<{
    costRequest: CostRequest;
    line: CostRequestLine;
  } | null>(null);
  title = RoutingService.getRouteTitle(RouteId.ENGINEERING_COSTING);
  loadingValidateEstimation = signal<boolean>(false);
  viewMode = signal<"list" | "card">("list");
  protected costRequestService = inject(CostRequestService);

  protected readonly Icons = Icons;
  protected readonly CostRequestStatus = CostRequestStatus;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  protected readonly RouteId = RouteId;
  protected readonly statusFilter = [
    CostRequestStatus.READY_TO_ESTIMATE,
    CostRequestStatus.PENDING_REESTIMATION,
    CostRequestStatus.READY_FOR_REVIEW,
  ];
  protected readonly lineStatusFilter = [CostRequestStatus.READY_TO_ESTIMATE];
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private handleMessage = inject(HandleToastMessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  refreshActiveView(): void {
    if (this.viewMode() === "card") {
      this.cardViewComponent?.refresh();
    } else {
      this.tableComponent?.refresh();
    }
  }

  estimateCostRequestLine(costRequest: CostRequest, line: CostRequestLine) {
    this.modalService
      .showCostRequestLineEstimationModal(costRequest, line, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.refreshActiveView();
      });
  }

  validateEstimationCostRequestLine(
    costRequest: CostRequest,
    line: CostRequestLine,
    event: any,
  ) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Validate estimation for line <strong>${line.customerPartNumber} - ${line.customerPartNumberRevision}</strong>?`,
      header: "Validate estimation",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: {
        label: "Cancel",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Validate estimation",
      },
      accept: () => {
        this.loadingValidateEstimation.set(true);
        this.costRequestLineRepo
          .validateEstimationCostRequestLine(costRequest.uid, line.uid)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() =>
              setTimeout(() => this.loadingValidateEstimation.set(false), 500),
            ),
          )
          .subscribe({
            next: () => {
              setTimeout(() => {
                this.handleMessage.successMessage("Line estimation validated");
                this.refreshActiveView();
              }, 500);
            },
          });
      },
      reject: () => {},
    });
  }

  outSourceCostRequestLine(
    costRequest: CostRequest,
    line: CostRequestLine,
    event: any,
  ) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Outsource line <strong>${line.customerPartNumber} - ${line.customerPartNumberRevision}</strong>?`,
      header: "Outsource line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: {
        label: "Cancel",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Outsource",
      },
      accept: () => {
        this.costRequestLineRepo
          .outsourceLine(costRequest.uid, line.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("Line outsourced");
              this.refreshActiveView();
            },
          });
      },
      reject: () => {},
    });
  }

  viewEstimationDetail(costRequest: CostRequest, line: CostRequestLine) {
    this.costRequestService
      .viewEstimationDetail(costRequest, line)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshActiveView());
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

  manageLineMessages(costRequest: CostRequest, line: CostRequestLine): void {
    this.modalService
      .showCostRequestLineMessageModal(costRequest.uid, line.uid, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  abortLine(costRequest: CostRequest, line: CostRequestLine, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Abort line <strong>${line.customerPartNumber} - ${line.customerPartNumberRevision}</strong>? This action cannot be undone.`,
      header: "Abort Line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "Cancel", outlined: true },
      acceptButtonProps: {
        label: "Abort",
      },
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
}
