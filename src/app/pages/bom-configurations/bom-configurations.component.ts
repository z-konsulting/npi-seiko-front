import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { TableColsTitle } from "../../models/enums/table-cols-title";
import { Icons } from "../../models/enums/icons";
import { Button } from "primeng/button";
import { SearchInputComponent } from "../../components/search-input/search-input.component";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { ModalService } from "../../services/components/modal.service";
import { CustomTitleComponent } from "../../components/custom-title/custom-title.component";
import { NoDoubleClickDirective } from "../../directives/no-double-click.directive";
import { BaseListComponent } from "../../models/classes/base-list-component";
import { BomConfiguration, BomConfigurationsPaginated } from "../../../client/costSeiko";
import { switchMap } from "rxjs";
import { BomConfigurationRepo } from "../../repositories/bom-configuration.repo";

@Component({
  selector: "app-bom-configurations",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
  ],
  templateUrl: "./bom-configurations.component.html",
  styleUrl: "./bom-configurations.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BomConfigurationsComponent extends BaseListComponent implements OnInit {
  configurations = signal<BomConfiguration[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private bomConfigRepo = inject(BomConfigurationRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.BOM_CONFIGURATIONS);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.bomConfigRepo
      .search(event.first, event.rows ?? undefined, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: BomConfigurationsPaginated) => {
        this.configurations.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  createConfiguration() {
    this.modalService
      .showBomConfigurationModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editConfiguration(config: BomConfiguration) {
    this.bomConfigRepo
      .retrieve(config.uid)
      .pipe(
        switchMap((retrieved) =>
          this.modalService.showBomConfigurationModal(true, retrieved),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated?: boolean) => {
        if (updated) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  archiveConfiguration(config: BomConfiguration) {
    this.bomConfigRepo
      .archive(config.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `BOM Configuration "${config.name}" archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }
}
