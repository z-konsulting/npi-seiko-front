import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ShipmentMethodFormField } from "../../../models/enums/form-field-names/shipment-method-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ShipmentMethodRepo } from "../../../repositories/shipment-method.repo";
import { ShipmentMethod } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { InputNumberModule } from "primeng/inputnumber";

@Component({
  selector: "app-shipment-method-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
  ],
  templateUrl: "./shipment-method-create-edit-dialog.component.html",
  styleUrl: "./shipment-method-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentMethodCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  shipmentMethodForm!: FormGroup;
  shipmentMethodEdited?: ShipmentMethod;
  editMode = signal<boolean>(false);

  protected readonly Icons = Icons;
  protected readonly ShipmentMethodFormField = ShipmentMethodFormField;

  private shipmentMethodRepo = inject(ShipmentMethodRepo);

  constructor() {
    super();
  }

  ngOnInit() {
    this.shipmentMethodForm = this.formService.buildShipmentMethodForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.shipmentMethodEdited = this.config.data.shipmentMethod;
        this.updateEditableShipmentMethodForm();
      }
    }
  }

  updateEditableShipmentMethodForm() {
    if (this.shipmentMethodEdited) {
      this.shipmentMethodForm.patchValue({
        [ShipmentMethodFormField.NAME]: this.shipmentMethodEdited.name,
        [ShipmentMethodFormField.PERCENTAGE]:
          this.shipmentMethodEdited.percentage,
      });
    }
  }

  createEditShipmentMethod() {
    if (this.shipmentMethodForm.invalid) {
      return;
    }

    const name = this.shipmentMethodForm.get(
      ShipmentMethodFormField.NAME,
    )?.value;
    const percentage = this.shipmentMethodForm.get(
      ShipmentMethodFormField.PERCENTAGE,
    )?.value;

    if (this.editMode()) {
      this.editShipmentMethod(name, percentage);
    } else {
      this.createShipmentMethod(name, percentage);
    }
  }

  createShipmentMethod(name: string, percentage: number) {
    this.shipmentMethodRepo
      .createShipmentMethod(name, percentage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Shipment method created");
          this.closeDialog(true);
        },
      });
  }

  editShipmentMethod(name: string, percentage: number) {
    this.shipmentMethodRepo
      .updateShipmentMethod(this.shipmentMethodEdited!.uid, name, percentage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Shipment method ${this.shipmentMethodEdited?.name} updated`,
          );
          this.closeDialog(true);
        },
      });
  }
}
