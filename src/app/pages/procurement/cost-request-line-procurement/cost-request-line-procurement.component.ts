import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { filter, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { InputNumberModule } from "primeng/inputnumber";
import { Button } from "primeng/button";
import { Tag } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import {
  CostRequestLine,
  CustomCostRequestLine,
  OutsourcingStatus,
} from "../../../../client/costSeiko";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { ModalService } from "../../../services/components/modal.service";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { Icons } from "../../../models/enums/icons";
import { OutsourcingStatusPipe } from "../../../pipes/outsourcing-status.pipe";
import { AutoFocusSelectDirective } from "../../../directives/auto-focus-select.directive";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { OverlayBadge } from "primeng/overlaybadge";

@Component({
  selector: "app-cost-request-line-procurement",
  imports: [
    TableModule,
    Button,
    Tag,
    TooltipModule,
    CardModule,
    PrimeTemplate,
    FormsModule,
    InputNumberModule,
    SearchInputComponent,
    CustomTitleComponent,
    OutsourcingStatusPipe,
    AutoFocusSelectDirective,
    OverlayBadge,
  ],
  templateUrl: "./cost-request-line-procurement.component.html",
  styleUrl: "./cost-request-line-procurement.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestLineProcurementComponent extends BaseListComponent {
  lines = signal<CustomCostRequestLine[]>([]);
  override title: string;
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  // Map uid → editing value (does not trigger change detection)
  protected editingValues = new Map<string, number | null>();

  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private handleMessage = inject(HandleToastMessageService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(
      RouteId.PROCUREMENT_COST_REQUEST_LINE,
    );
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.costRequestLineRepo
      .searchToBeEstimated(
        event.first ?? 0,
        event.rows ?? this.maxRowDefault,
        this.searchText,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.lines.set(result.results);
        this.totalRecords = result.total;
        this.loading = false;
      });
  }

  onRowEditInit(line: CustomCostRequestLine): void {
    this.editingValues.set(
      line.uid,
      line.outsourcedCostInSystemCurrency ?? null,
    );
  }

  onRowEditSave(line: CustomCostRequestLine): void {
    const value = this.editingValues.get(line.uid);
    if (value == null || value <= 0) {
      this.handleMessage.errorMessage("Invalid cost value");
      return;
    }
    this.costRequestLineRepo
      .estimateLine(line.uid, { unitCostInCurrency: value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadData(this.lastTableLazyLoadEvent);
          this.handleMessage.successMessage(
            "Request for quotation line estimated successfully",
          );
        },
      });
  }

  onRowEditCancel(line: CustomCostRequestLine): void {
    this.editingValues.delete(line.uid);
  }

  updateEditingValue(uid: string, value: number | null): void {
    this.editingValues.set(uid, value);
  }

  manageLineMessages(line: CostRequestLine): void {
    this.modalService
      .showCostRequestLineMessageModal(
        line.parentCostRequestUid,
        line.uid,
        false,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  rejectLine(line: CustomCostRequestLine): void {
    this.modalService
      .showCostRequestLineRejectModal()
      .pipe(
        filter((reason): reason is string => !!reason),
        switchMap((reason: string) =>
          this.costRequestLineRepo.rejectLine(line.uid, {
            rejectReason: reason,
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadData(this.lastTableLazyLoadEvent);
          this.handleMessage.successMessage(
            "Request for quotation line rejected",
          );
        },
      });
  }
}
