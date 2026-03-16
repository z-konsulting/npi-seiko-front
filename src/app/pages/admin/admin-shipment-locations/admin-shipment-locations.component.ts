import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { Button } from "primeng/button";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { TagModule } from "primeng/tag";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { RouteId } from "../../../models/enums/routes-id";
import { RoutingService } from "../../../services/Routing.service";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { Icons } from "../../../models/enums/icons";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import {
  ShipmentLocation,
  ShipmentLocationsPaginated,
} from "../../../../client/costSeiko";
import { ShipmentLocationRepo } from "../../../repositories/shipment-location-repo.service";

@Component({
  selector: "app-admin-shipment-locations",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
    TagModule,
  ],
  templateUrl: "./admin-shipment-locations.component.html",
  styleUrl: "./admin-shipment-locations.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShipmentLocationsComponent
  extends BaseListComponent
  implements OnInit
{
  items = signal<ShipmentLocation[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private shipmentLocationRepo = inject(ShipmentLocationRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_SHIPMENT_LOCATIONS);
  }

  ngOnInit(): void {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.shipmentLocationRepo
      .searchShipmentLocations(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: ShipmentLocationsPaginated) => {
        this.items.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  createItem(): void {
    this.modalService
      .showShipmentLocationCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editItem(item: ShipmentLocation): void {
    this.shipmentLocationRepo
      .retrieveShipmentLocation(item.uid)
      .pipe(
        switchMap((retrieved) =>
          this.modalService.showShipmentLocationCreateEditModal(
            true,
            retrieved,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  archiveItem(item: ShipmentLocation): void {
    this.shipmentLocationRepo
      .archiveShipmentLocation(item.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(`"${item.name}" archived`);
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }
}
