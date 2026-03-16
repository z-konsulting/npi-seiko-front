import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ProcessRepo } from "../../../repositories/process.repo";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { Process, ProcessesPaginated } from "../../../../client/costSeiko";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { FormsModule } from "@angular/forms";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { Chip } from "primeng/chip";
import { Tag } from "primeng/tag";
import { switchMap } from "rxjs";

@Component({
  selector: "app-admin-processes",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
    FormsModule,
    Chip,
    Tag,
  ],
  templateUrl: "./admin-processes.component.html",
  styleUrl: "./admin-processes.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProcessesComponent
  extends BaseListComponent
  implements OnInit
{
  processes = signal<Process[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private processRepo = inject(ProcessRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_PROCESSES);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.loading = false;
    this.processRepo
      .searchProcesses(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: ProcessesPaginated) => {
        this.processes.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  archiveProcess(process: Process) {
    this.processRepo
      .archiveProcess(process.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(`Process ${process.name} archived`);
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createProcess() {
    this.modalService
      .showProcessCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editProcess(process: Process) {
    this.processRepo
      .getProcess(process.uid)
      .pipe(
        switchMap((pro) =>
          this.modalService.showProcessCreateEditModal(true, pro),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }
}
