import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { RoutingService } from "../../../../services/Routing.service";
import { RouteId } from "../../../../models/enums/routes-id";
import { TableColsTitle } from "../../../../models/enums/table-cols-title";
import { Icons } from "../../../../models/enums/icons";
import { Button } from "primeng/button";
import { SearchInputComponent } from "../../../../components/search-input/search-input.component";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { TabsModule } from "primeng/tabs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HandleToastMessageService } from "../../../../services/handle-toast-message.service";
import { ModalService } from "../../../../services/components/modal.service";
import { NoDoubleClickDirective } from "../../../../directives/no-double-click.directive";
import { BaseListComponent } from "../../../../models/classes/base-list-component";
import {
  Material,
  MaterialsPaginated,
  MaterialStatus,
  MaterialType,
} from "../../../../../client/costSeiko";
import { switchMap } from "rxjs";
import { MaterialRepo } from "../../../../repositories/material.repo";
import { MaterialTypePipe } from "../../../../pipes/material-type.pipe";
import { TruncateCellComponent } from "../../../../components/truncate-cell/truncate-cell.component";
import { Chip } from "primeng/chip";
import { QueryParamKey } from "../../../../models/enums/queryParamKey";

@Component({
  selector: "app-materials-list",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    NoDoubleClickDirective,
    MaterialTypePipe,
    TabsModule,
    TruncateCellComponent,
    Chip,
  ],
  templateUrl: "./materials-list.component.html",
  styleUrl: "./materials-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialsListComponent
  extends BaseListComponent
  implements OnInit
{
  filterMaterialStatus = input.required<MaterialStatus[]>();
  filterMaterialType = input.required<MaterialType>();
  totalRecordsChange = output<number>();
  materials = signal<Material[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;
  protected readonly MaterialStatus = MaterialStatus;
  private materialRepo = inject(MaterialRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);
  private router = inject(Router);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.MATERIALS_LIST);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.materialRepo
      .searchMaterials(
        event.first,
        event.rows,
        this.searchText,
        this.filterMaterialStatus(),
        this.filterMaterialType(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: MaterialsPaginated) => {
        this.materials.set(results.results);
        this.totalRecords = results.total;
        this.totalRecordsChange.emit(this.totalRecords);
        this.loading = false;
      });
  }

  archiveMaterial(material: Material) {
    this.materialRepo
      .archiveMaterial(material.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Material ${material.systemId} archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createMaterial() {
    this.modalService
      .showMaterialCreateEditModal(false, this.filterMaterialType())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editMaterial(material: Material) {
    this.materialRepo
      .retrieveMaterial(material.uid)
      .pipe(
        switchMap((retrievedMaterial) =>
          this.modalService.showMaterialCreateEditModal(
            true,
            this.filterMaterialType(),
            retrievedMaterial,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  navigateToCreateManufacturer(draftName: string | undefined): void {
    if (!draftName) return;
    this.router.navigate(
      [RoutingService.getFullPath(RouteId.ADMIN_SUPPLIERS_MANUFACTURERS)],
      { queryParams: { [QueryParamKey.MANUFACTURER_NAME]: draftName } },
    );
  }

  navigateToCreateCategory(draftName: string | undefined): void {
    if (!draftName) return;
    this.router.navigate(
      [RoutingService.getFullPath(RouteId.ADMIN_MATERIAL_CATEGORIES)],
      { queryParams: { [QueryParamKey.CATEGORY_NAME]: draftName } },
    );
  }

  navigateToCreateUnit(draftName: string | undefined): void {
    if (!draftName) return;
    this.router.navigate(
      [RoutingService.getFullPath(RouteId.ADMIN_UNITS)],
      { queryParams: { [QueryParamKey.UNIT_NAME]: draftName } },
    );
  }

  manageSuppliers(material: Material): void {
    this.modalService
      .showMaterialSupplierManageModal(
        material.uid,
        material.manufacturerPartNumber,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData(this.lastTableLazyLoadEvent));
  }
}
