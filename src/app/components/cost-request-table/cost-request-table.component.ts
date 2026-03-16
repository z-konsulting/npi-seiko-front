import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { TableColsTitle } from "../../models/enums/table-cols-title";
import { Icons } from "../../models/enums/icons";
import { Button } from "primeng/button";
import { SearchInputComponent } from "../search-input/search-input.component";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CostRequestRepo } from "../../repositories/cost-request.repo";
import {
  ArchivedFilter,
  CostRequest,
  CostRequestLine,
  CostRequestLineProcurementStatus,
  CostRequestsPaginated,
  CostRequestStatus,
  OutsourcingStatus,
} from "../../../client/costSeiko";
import { BaseListComponent } from "../../models/classes/base-list-component";
import { TagModule } from "primeng/tag";
import { DatePipe, NgTemplateOutlet } from "@angular/common";
import { CostRequestStatusPipe } from "../../pipes/cost-request-status.pipe";
import { CRMethodTypePipe } from "../../pipes/cr-method-type.pipe";
import { BadgeModule } from "primeng/badge";
import { OverlayBadge } from "primeng/overlaybadge";
import { Popover } from "primeng/popover";
import { RouteId } from "../../models/enums/routes-id";
import { CostRequestLineProcurementStatusPipe } from "../../pipes/cost-request-line-procurement-status.pipe";
import { OutsourcingStatusPipe } from "../../pipes/outsourcing-status.pipe";
import { CostRequestLineRepo } from "../../repositories/cost-request-line.repo";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { CostRequestService } from "../../services/cost-request.service";
import { Chip } from "primeng/chip";
import { TruncateCellComponent } from "../truncate-cell/truncate-cell.component";

@Component({
  selector: "app-cost-request-table",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    TagModule,
    DatePipe,
    CostRequestStatusPipe,
    CRMethodTypePipe,
    BadgeModule,
    OverlayBadge,
    Popover,
    NgTemplateOutlet,
    CostRequestLineProcurementStatusPipe,
    OutsourcingStatusPipe,
    Chip,
    TruncateCellComponent,
  ],
  templateUrl: "./cost-request-table.component.html",
  styleUrl: "./cost-request-table.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestTableComponent
  extends BaseListComponent
  implements OnInit
{
  // Configuration inputs
  @ViewChild("materialsPopover") materialsPopover!: Popover;
  routeId = input<RouteId | undefined>(undefined);
  archivedFilter = input<ArchivedFilter>(ArchivedFilter.NON_ARCHIVED_ONLY);
  statusFilter = input<CostRequestStatus[]>([]);
  lineStatusFilter = input<CostRequestStatus[]>([]);
  showMainActionsColumn = input<boolean>(false);
  allowToggle = input<boolean>(true);
  showLineCheckboxes = input<boolean>(false);
  lineSelection = model<CostRequestLine[]>([]);
  initialSearch = input<string>("");
  activeFilterStatus = input<boolean>(false);

  // Outputs
  lineOutsourced = output<void>();
  searchChange = output<string>();

  // Internal state
  costRequests = signal<CostRequest[]>([]);
  expandedRows: { [key: string]: boolean } = {};
  selectedLineForMaterials = signal<CostRequestLine | null>(null);
  engineeringView = computed(
    () =>
      this.routeId() === RouteId.ENGINEERING_COSTING ||
      this.routeId() === RouteId.ENGINEERING_QUOTATION,
  );
  costingView = computed(
    () =>
      this.routeId() === RouteId.ENGINEERING_COSTING ||
      this.routeId() === RouteId.COST_REQUEST_COSTING,
  );
  // Status column filter
  columnStatusFilter = signal<CostRequestStatus[]>([]);
  hasActiveStatusFilter = computed(
    () => this.columnStatusFilter().length > 0 && this.activeFilterStatus(),
  );
  statusFilterOptions = computed<CostRequestStatus[]>(() =>
    this.engineeringView()
      ? [CostRequestStatus.READY_TO_ESTIMATE]
      : Object.values(CostRequestStatus),
  );
  // Content projection templates (signal-based for reactivity with OnPush)
  captionLeftTemplate = contentChild<TemplateRef<unknown>>("captionLeft");
  captionRightTemplate = contentChild<TemplateRef<unknown>>("captionRight");
  rowActionsTemplate = contentChild<TemplateRef<unknown>>("rowActions");
  lineHeaderActionsTemplate =
    contentChild<TemplateRef<unknown>>("lineHeaderActions");
  lineActionsTemplate = contentChild<TemplateRef<unknown>>("lineActions");

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;
  protected readonly CostRequestStatus = CostRequestStatus;
  protected readonly CostRequestLineProcurementStatus =
    CostRequestLineProcurementStatus;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  protected costRequestService = inject(CostRequestService);
  private costRequestRepo = inject(CostRequestRepo);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private handleMessage = inject(HandleToastMessageService);

  constructor() {
    super();

    // Reload data when archivedFilter, statusFilter or columnStatusFilter changes
    effect(() => {
      this.archivedFilter();
      this.statusFilter();
      this.columnStatusFilter();
      if (this.lastTableLazyLoadEvent) {
        this.loadData(this.lastTableLazyLoadEvent);
      }
    });
  }

  ngOnInit() {
    this.loading = true;
    this.searchText = this.initialSearch();
  }

  override activateSearch(searchText: string): void {
    super.activateSearch(searchText);
    this.searchChange.emit(searchText);
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    const combined = [
      ...new Set([...this.statusFilter(), ...this.columnStatusFilter()]),
    ];
    const searchApi = this.costingView()
      ? this.costRequestRepo.searchEngineeringCostRequests(
          event.first,
          event.rows,
          this.searchText,
          this.archivedFilter(),
          combined.length > 0 ? combined : undefined,
          this.lineStatusFilter() ? this.lineStatusFilter() : undefined,
        )
      : this.costRequestRepo.searchCostRequests(
          event.first,
          event.rows,
          this.searchText,
          this.archivedFilter(),
          combined.length > 0 ? combined : undefined,
          this.lineStatusFilter() ? this.lineStatusFilter() : undefined,
        );
    searchApi
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: CostRequestsPaginated) => {
        this.costRequests.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  refresh(): void {
    this.loadData(this.lastTableLazyLoadEvent);
  }

  toggleRow(lineClickedId: string) {
    if (!this.allowToggle()) return;
    if (!this.expandedRows[lineClickedId]) {
      this.expandedRows[lineClickedId] = true;
    } else {
      delete this.expandedRows[lineClickedId];
    }
  }

  getLinesCount(costRequest: CostRequest): number {
    return costRequest.lines?.length || 0;
  }

  getMaterialLines(line: CostRequestLine | null): any[] {
    if (!line) return [];
    return (line as any).materialLines || [];
  }

  isStatusSelected(status: CostRequestStatus): boolean {
    return this.columnStatusFilter().includes(status);
  }

  onStatusFilterToggle(status: CostRequestStatus): void {
    const current = this.columnStatusFilter();
    if (current.includes(status)) {
      this.columnStatusFilter.set(current.filter((s) => s !== status));
    } else {
      this.columnStatusFilter.set([...current, status]);
    }
  }

  clearStatusFilter(): void {
    this.columnStatusFilter.set([]);
  }

  outsourceLine(costRequestUid: string, line: CostRequestLine): void {
    this.costRequestLineRepo
      .outsourceLine(costRequestUid, line.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Line outsourced successfully");
          this.lineOutsourced.emit();
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  getProcurementStatusDescription(line: CostRequestLine) {
    let pendingInformation = null;
    if (line.procurementStatus == CostRequestLineProcurementStatus.PENDING) {
      if (line?.nbMaterialLines && line.nbMaterialLines > 0) {
        pendingInformation = `Pending for material lines`;
      }
      if (line?.nbToolingLines && line.nbToolingLines > 0) {
        pendingInformation = `Pending for tooling lines`;
      }
    }
    return pendingInformation;
  }
}
