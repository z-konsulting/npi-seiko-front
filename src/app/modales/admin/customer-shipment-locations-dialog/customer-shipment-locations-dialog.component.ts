import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { BaseModal } from "../../../models/classes/base-modal";
import {
  Currency,
  Customer,
  CustomerShipmentLocation,
  ShipmentLocation,
} from "../../../../client/costSeiko";
import { Icons } from "../../../models/enums/icons";
import { CustomerRepo } from "../../../repositories/customer.repo";
import { ShipmentLocationRepo } from "../../../repositories/shipment-location-repo.service";

@Component({
  selector: "app-customer-shipment-locations-dialog",
  imports: [
    FormsModule,
    Button,
    SelectModule,
    TableModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: "./customer-shipment-locations-dialog.component.html",
  styleUrl: "./customer-shipment-locations-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerShipmentLocationsDialogComponent
  extends BaseModal
  implements OnInit
{
  customer: Customer = this.dataConfig.customer;

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  shipmentLocations = signal<ShipmentLocation[]>([]);
  customerShipmentLocations = signal<CustomerShipmentLocation[]>([]);

  selectedShipmentLocation = signal<ShipmentLocation | null>(null);
  selectedCurrency = signal<Currency | null>(null);

  availableCurrencies = computed<Currency[]>(() => {
    const sl = this.selectedShipmentLocation();
    return sl?.acceptedCurrencies ?? [];
  });

  protected readonly Icons = Icons;

  private customerRepo = inject(CustomerRepo);
  private shipmentLocationRepo = inject(ShipmentLocationRepo);

  ngOnInit(): void {
    this.loadData();
  }

  onShipmentLocationChange(): void {
    this.selectedCurrency.set(null);
  }

  addShipmentLocation(): void {
    const sl = this.selectedShipmentLocation();
    const currency = this.selectedCurrency();
    if (!sl || !currency) return;

    this.isSaving.set(true);
    this.customerRepo
      .createCustomerShipmentLocation(this.customer.uid, {
        shipmentLocationId: sl.uid,
        currencyId: currency.uid,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.customerShipmentLocations.set(result);
          this.selectedShipmentLocation.set(null);
          this.selectedCurrency.set(null);
          this.handleMessage.successMessage("Shipment location added");
        },
      });
  }

  deleteShipmentLocation(item: CustomerShipmentLocation): void {
    this.customerRepo
      .deleteCustomerShipmentLocation(this.customer.uid, item.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.customerShipmentLocations.set(result);
          this.handleMessage.successMessage("Shipment location removed");
        },
      });
  }

  private loadData(): void {
    this.shipmentLocationRepo
      .listAllShipmentLocations()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((shipmentLocations) => {
        this.shipmentLocations.set(shipmentLocations);
      });

    this.customerRepo
      .getCustomerShipmentLocations(this.customer.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customerShipmentLocations) => {
        this.customerShipmentLocations.set(customerShipmentLocations);
      });
  }
}
