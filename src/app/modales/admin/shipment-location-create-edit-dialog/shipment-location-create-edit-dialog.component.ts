import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Button } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { Icons } from "../../../models/enums/icons";
import { ShipmentLocationFormField } from "../../../models/enums/form-field-names/shipment-location-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Currency,
  ShipmentLocation,
  ShipmentLocationCreate,
  ShipmentLocationUpdate,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { ShipmentLocationRepo } from "../../../repositories/shipment-location-repo.service";
import { CurrencyRepo } from "../../../repositories/currency.repo";

@Component({
  selector: "app-shipment-location-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    MultiSelectModule,
  ],
  templateUrl: "./shipment-location-create-edit-dialog.component.html",
  styleUrl: "./shipment-location-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentLocationCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  form!: FormGroup;
  editMode = signal<boolean>(false);
  itemEdited?: ShipmentLocation;
  currencies = signal<Currency[]>([]);

  protected readonly Icons = Icons;
  protected readonly ShipmentLocationFormField = ShipmentLocationFormField;

  private shipmentLocationRepo = inject(ShipmentLocationRepo);
  private currencyRepo = inject(CurrencyRepo);

  ngOnInit(): void {
    this.form = this.formService.buildShipmentLocationForm();

    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currencies) => {
        this.currencies.set(currencies);
      });

    if (this.config.data) {
      this.editMode.set(this.config.data.editMode);
      if (this.editMode()) {
        this.itemEdited = this.config.data.item;
        this.form.patchValue({
          [ShipmentLocationFormField.NAME]: this.itemEdited?.name ?? "",
          [ShipmentLocationFormField.ACCEPTED_CURRENCIES]:
            this.itemEdited?.acceptedCurrencies?.map((c) => c.uid) ?? [],
        });
      }
    }
  }

  createEdit(): void {
    if (this.form.invalid) return;

    const body: ShipmentLocationCreate | ShipmentLocationUpdate = {
      name: this.form.get(ShipmentLocationFormField.NAME)?.value,
      acceptedCurrencyIds:
        this.form.get(ShipmentLocationFormField.ACCEPTED_CURRENCIES)?.value ??
        [],
    };

    if (this.editMode()) {
      this.shipmentLocationRepo
        .updateShipmentLocation(this.itemEdited!.uid, body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage(
              `"${this.itemEdited?.name}" updated`,
            );
            this.closeDialog(true);
          },
        });
    } else {
      this.shipmentLocationRepo
        .createShipmentLocation(body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage("Shipment location created");
            this.closeDialog(true);
          },
        });
    }
  }
}
