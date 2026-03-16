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
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import {
  ShipmentMethod,
  ShipmentMethodsPaginated,
} from "../../../../client/costSeiko";
import { switchMap } from "rxjs";
import { ShipmentMethodRepo } from "../../../repositories/shipment-method.repo";

@Component({
  selector: "app-admin-shipment-methods",
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
  templateUrl: "./admin-shipment-methods.component.html",
  styleUrl: "./admin-shipment-methods.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShipmentMethodsComponent
  extends BaseListComponent
  implements OnInit
{
  shipmentMethods = signal<ShipmentMethod[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private shipmentMethodRepo = inject(ShipmentMethodRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_SHIPMENT_METHODS);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.shipmentMethodRepo
      .searchShipmentMethods(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: ShipmentMethodsPaginated) => {
        this.shipmentMethods.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  archiveShipmentMethod(shipmentMethod: ShipmentMethod) {
    this.shipmentMethodRepo
      .archiveShipmentMethod(shipmentMethod.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Shipment method ${shipmentMethod.name} archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createShipmentMethod() {
    this.modalService
      .showShipmentMethodCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editShipmentMethod(shipmentMethod: ShipmentMethod) {
    this.shipmentMethodRepo
      .retrieveShipmentMethod(shipmentMethod.uid)
      .pipe(
        switchMap((retrievedShipmentMethod) =>
          this.modalService.showShipmentMethodCreateEditModal(
            true,
            retrievedShipmentMethod,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }
}
