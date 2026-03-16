import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { filter, finalize, switchMap } from "rxjs";
import { CardModule } from "primeng/card";
import { Table, TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { Icons } from "../../../models/enums/icons";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { CustomCostRequestLine } from "../../../../client/costSeiko";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { ConfirmationService } from "primeng/api";

@Component({
  selector: "app-pending-approval-list",
  imports: [
    CardModule,
    TableModule,
    Button,
    TooltipModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
  ],
  templateUrl: "./pending-approval-list.component.html",
  styleUrl: "./pending-approval-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingApprovalListComponent
  extends BaseListComponent
  implements OnInit
{
  lines = signal<CustomCostRequestLine[]>([]);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;

  private dt = viewChild<Table>("dt");
  private costRequestRepo = inject(CostRequestRepo);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);
  private confirmationService = inject(ConfirmationService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(
      RouteId.MANAGEMENT_PENDING_APPROVAL,
    );
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData(): void {
    this.loading = true;
    this.costRequestLineRepo
      .listPendingApprovalLines()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (result) => {
          this.lines.set(result);
        },
      });
  }

  applyFilterGlobal(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dt()?.filterGlobal(value, "contains");
  }

  viewEstimationDetails(line: CustomCostRequestLine): void {
    this.costRequestRepo
      .getCostRequest(line.parentCostRequestUid)
      .pipe(
        switchMap((costRequest) =>
          this.modalService.showEstimationDetailModal(costRequest, line),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData();
      });
  }

  approvePrice(line: CustomCostRequestLine, event: any): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Approve line "${line.customerPartNumber} - ${line.customerPartNumberRevision}" price?`,
      header: "Approve Line",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      rejectButtonProps: { label: "No", outlined: true },
      acceptButtonProps: { label: "Approve" },
      accept: () => {
        this.costRequestLineRepo
          .approvePriceByManagement(line.parentCostRequestUid, line.uid)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("Price approved successfully");
              this.loadData();
            },
          });
      },
      reject: () => {},
    });
  }

  rejectPrice(line: CustomCostRequestLine): void {
    this.modalService
      .showRejectPriceModal()
      .pipe(
        filter((reason): reason is string => !!reason),
        switchMap((reason: string) =>
          this.costRequestLineRepo.rejectPriceByManagement(
            line.parentCostRequestUid,
            line.uid,
            { reason },
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Price rejected successfully");
          this.loadData();
        },
      });
  }
}
