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
import { debounceTime, finalize, Subject } from "rxjs";
import { CardModule } from "primeng/card";
import { Table, TableLazyLoadEvent, TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { Icons } from "../../../models/enums/icons";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { FileService } from "../../../services/file.service";
import { CustomCostRequestLine } from "../../../../client/costSeiko";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";

@Component({
  selector: "app-planning-list",
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
    SearchInputComponent,
  ],
  templateUrl: "./planning-list.component.html",
  styleUrl: "./planning-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanningListComponent extends BaseListComponent implements OnInit {
  lines = signal<CustomCostRequestLine[]>([]);
  exportingLineUid = signal<string | null>(null);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;

  private dt = viewChild<Table>("dt");
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private handleMessage = inject(HandleToastMessageService);
  private fileService = inject(FileService);
  private lazyLoadEvent$ = new Subject<TableLazyLoadEvent>();

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.PLANNING_LIST);
  }

  ngOnInit(): void {
    this.lazyLoadEvent$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.loadData(event));
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);

    this.costRequestLineRepo
      .searchPlanningLines(event.first, event.rows, this.searchText)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (result) => {
          this.lines.set(result.results);
          this.totalRecords = result.total;
        },
      });
  }

  applyFilterGlobal(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.dt()?.reset();
  }

  exportProductionBom(line: CustomCostRequestLine): void {
    this.exportingLineUid.set(line.uid);
    this.costRequestLineRepo
      .exportProductionBom(line.parentCostRequestUid, line.uid)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.exportingLineUid.set(null)),
      )
      .subscribe({
        next: (response) => {
          this.fileService.downloadFile(response.body, response, "");
        },
        error: () => {
          this.handleMessage.errorMessage("Failed to export production BOM");
        },
      });
  }
}
