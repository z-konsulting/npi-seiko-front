import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
  TemplateRef,
  untracked,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DatePipe, DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { Button } from "primeng/button";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import type { PaginatorState } from "primeng/paginator";
import { PaginatorModule } from "primeng/paginator";
import {
  ArchivedFilter,
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
} from "../../../client/costSeiko";
import { CostRequestRepo } from "../../repositories/cost-request.repo";
import { CostRequestStatusPipe } from "../../pipes/cost-request-status.pipe";
import { CostRequestService } from "../../services/cost-request.service";
import { Icons } from "../../models/enums/icons";
import { SearchInputComponent } from "../search-input/search-input.component";
import { SkeletonModule } from "primeng/skeleton";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { Chip } from "primeng/chip";
import { NoDoubleClickDirective } from "../../directives/no-double-click.directive";
import { TruncateCellComponent } from "../truncate-cell/truncate-cell.component";

@Component({
  selector: "app-cost-request-card-view",
  imports: [
    Button,
    TagModule,
    TooltipModule,
    PaginatorModule,
    DatePipe,
    DecimalPipe,
    CostRequestStatusPipe,
    SearchInputComponent,
    SkeletonModule,
    NgTemplateOutlet,
    CheckboxModule,
    FormsModule,
    Chip,
    NoDoubleClickDirective,
    TruncateCellComponent,
  ],
  templateUrl: "./cost-request-card-view.component.html",
  styleUrl: "./cost-request-card-view.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestCardViewComponent implements OnInit {
  // Inputs from parent
  archivedFilter = input<ArchivedFilter>(ArchivedFilter.NON_ARCHIVED_ONLY);
  statusFilter = input<CostRequestStatus[]>([]);
  lineStatuses = input<CostRequestStatus[]>([]);
  cloneMode = input<boolean>(false);
  cloneCostRequestUid = input<string | null>(null);
  selectedLinesForClone = model<CostRequestLine[]>([]);
  initialSearch = input<string>("");
  initialPage = input<number>(0);
  costingView = input<boolean>(false);

  // Persistence outputs
  searchChange = output<string>();
  pageIndexChange = output<number>();

  // Clone outputs
  onConfirmClone = output<void>();
  onCancelClone = output<void>();

  // Content projection — mirrors table component pattern
  captionLeftTemplate = contentChild<TemplateRef<unknown>>("captionLeft");
  captionRightTemplate = contentChild<TemplateRef<unknown>>("captionRight");
  rowActionsTemplate = contentChild<TemplateRef<unknown>>("rowActions");
  lineHeaderActionsTemplate =
    contentChild<TemplateRef<unknown>>("lineHeaderActions");
  lineActionsTemplate = contentChild<TemplateRef<unknown>>("lineActions");
  // Internal state
  costRequests = signal<CostRequest[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(true);
  expandedCards = signal<Record<string, boolean>>({});
  searchText = "";
  page = signal<number>(0);
  readonly pageSize = 12;
  protected readonly Icons = Icons;
  protected readonly CostRequestStatus = CostRequestStatus;
  protected readonly costRequestService = inject(CostRequestService);
  private readonly costRequestRepo = inject(CostRequestRepo);
  private readonly destroyRef = inject(DestroyRef);
  private isFirstLoad = true;

  constructor() {
    // Reload when archivedFilter changes.
    // On first run: ngOnInit already initialized searchText/page from inputs, just load.
    // On subsequent runs: archivedFilter changed, reset page to 0 then load.
    effect(() => {
      this.archivedFilter();
      this.statusFilter();
      untracked(() => {
        if (this.isFirstLoad) {
          this.isFirstLoad = false;
        } else {
          this.page.set(0);
        }
        this.loadData();
      });
    });

    // Auto-expand the card when clone mode activates for a specific cost request
    effect(() => {
      const uid = this.cloneCostRequestUid();
      if (uid && this.cloneMode()) {
        untracked(() => {
          const current = this.expandedCards();
          if (!current[uid]) {
            this.expandedCards.set({ ...current, [uid]: true });
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.searchText = this.initialSearch();
    this.page.set(this.initialPage());
  }

  loadData(): void {
    this.loading.set(true);
    const filter = this.statusFilter();
    const lineFilter = this.lineStatuses();
    const searchApi = this.costingView()
      ? this.costRequestRepo.searchEngineeringCostRequests(
          this.page() * this.pageSize,
          this.pageSize,
          this.searchText,
          this.archivedFilter(),
          filter.length > 0 ? filter : undefined,
          lineFilter.length > 0 ? lineFilter : undefined,
        )
      : this.costRequestRepo.searchCostRequests(
          this.page() * this.pageSize,
          this.pageSize,
          this.searchText,
          this.archivedFilter(),
          filter.length > 0 ? filter : undefined,
          lineFilter.length > 0 ? lineFilter : undefined,
        );
    searchApi.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((results) => {
      this.costRequests.set(results.results);
      this.totalRecords.set(results.total);
      this.loading.set(false);
    });
  }

  refresh(): void {
    this.loadData();
  }

  onSearch(text: string): void {
    this.searchText = text;
    this.page.set(0);
    this.loadData();
    this.searchChange.emit(text);
  }

  onPageChange(event: PaginatorState): void {
    const page = event.page ?? 0;
    this.page.set(page);
    this.loadData();
    this.pageIndexChange.emit(page);
  }

  toggleExpanded(uid: string): void {
    const current = this.expandedCards();
    this.expandedCards.set({ ...current, [uid]: !current[uid] });
  }

  isExpanded(uid: string): boolean {
    return !!this.expandedCards()[uid];
  }

  isInCloneMode(uid: string): boolean {
    return this.cloneMode() && this.cloneCostRequestUid() === uid;
  }

  isLineSelectedForClone(line: CostRequestLine): boolean {
    return this.selectedLinesForClone().some((l) => l.uid === line.uid);
  }

  toggleLineForClone(line: CostRequestLine): void {
    const current = this.selectedLinesForClone();
    if (this.isLineSelectedForClone(line)) {
      this.selectedLinesForClone.set(current.filter((l) => l.uid !== line.uid));
    } else {
      this.selectedLinesForClone.set([...current, line]);
    }
  }

  areAllLinesSelected(lines: CostRequestLine[]): boolean {
    return (
      lines.length > 0 && lines.every((l) => this.isLineSelectedForClone(l))
    );
  }

  toggleSelectAllLines(lines: CostRequestLine[]): void {
    if (this.areAllLinesSelected(lines)) {
      this.selectedLinesForClone.set([]);
    } else {
      this.selectedLinesForClone.set([...lines]);
    }
  }

  getStripColor(status: CostRequestStatus): string {
    // References the CSS variables defined in global.scss (--status-*)
    switch (status) {
      case CostRequestStatus.PENDING_INFORMATION:
        return "var(--status-pending-information)";
      case CostRequestStatus.READY_FOR_REVIEW:
        return "var(--status-ready-for-review)";
      case CostRequestStatus.READY_TO_ESTIMATE:
        return "var(--status-ready-to-estimate)";
      case CostRequestStatus.READY_FOR_MARKUP:
        return "var(--status-ready-for-markup)";
      case CostRequestStatus.READY_TO_VALIDATE:
        return "var(--status-ready-to-validate)";
      case CostRequestStatus.PENDING_APPROVAL:
        return "var(--status-pending-approval)";
      case CostRequestStatus.PRICE_APPROVED:
        return "var(--status-price-approved)";
      case CostRequestStatus.PRICE_REJECTED:
        return "var(--status-price-rejected)";
      case CostRequestStatus.PENDING_REESTIMATION:
        return "var(--status-pending-reestimation)";
      case CostRequestStatus.READY_TO_QUOTE:
        return "var(--status-quoted)";
      case CostRequestStatus.ABORTED:
        return "var(--status-aborted)";
      case CostRequestStatus.NEW_REVISION_CREATED:
        return "var(--status-new-revision-created)";
      case CostRequestStatus.ACTIVE:
        return "var(--status-active)";
      case CostRequestStatus.WON:
        return "var(--status-won)";
      case CostRequestStatus.LOST:
        return "var(--status-lost)";
      default:
        return "var(--status-ready-to-estimate)";
    }
  }

  skeletonItems(): number[] {
    return Array.from({ length: 6 }, (_, i) => i);
  }
}
