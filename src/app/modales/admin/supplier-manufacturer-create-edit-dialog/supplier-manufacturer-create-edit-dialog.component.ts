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
import { SupplierManufacturerFormField } from "../../../models/enums/form-field-names/supplier-manufacturer-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ShipmentMethod,
  SupplierAndManufacturer,
  SupplierAndManufacturerCreate,
  SupplierAndManufacturerType,
  SupplierAndManufacturerUpdate,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { SelectModule } from "primeng/select";
import { ShipmentMethodRepo } from "../../../repositories/shipment-method.repo";
import { SupplierManufacturerRepo } from "../../../repositories/supplier-manufacturer.repo";
import { EnumTransformerService } from "../../../services/components/enum-transformer.service";
import { SupplierAndManufacturerTypePipe } from "../../../pipes/supplier-and-manufacturer-type.pipe";

@Component({
  selector: "app-supplier-manufacturer-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    SelectModule,
  ],
  providers: [SupplierAndManufacturerTypePipe],
  templateUrl: "./supplier-manufacturer-create-edit-dialog.component.html",
  styleUrl: "./supplier-manufacturer-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierManufacturerCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  form!: FormGroup;
  itemEdited?: SupplierAndManufacturer;
  editMode = signal<boolean>(false);
  shipmentMethods = signal<ShipmentMethod[]>([]);
  typeOptions = signal<{ label: string; value: SupplierAndManufacturerType }[]>(
    [],
  );

  protected readonly Icons = Icons;
  protected readonly SupplierManufacturerFormField =
    SupplierManufacturerFormField;

  private supplierManufacturerRepo = inject(SupplierManufacturerRepo);
  private shipmentMethodRepo = inject(ShipmentMethodRepo);
  private enumTransformer = inject(EnumTransformerService);
  private supplierAndManufacturerTypePipe = inject(
    SupplierAndManufacturerTypePipe,
  );

  ngOnInit() {
    this.form = this.formService.buildSupplierManufacturerForm();
    this.initTypeOptions();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.itemEdited = config.item;
        this.form.patchValue({
          [SupplierManufacturerFormField.NAME]: this.itemEdited?.name ?? "",
          [SupplierManufacturerFormField.CODE]: this.itemEdited?.code ?? null,
          [SupplierManufacturerFormField.SHIPMENT_METHOD]:
            this.itemEdited?.shipmentMethod?.uid ?? null,
          [SupplierManufacturerFormField.TYPE]: this.itemEdited?.type ?? null,
        });
      } else if (config.prefill) {
        this.form.patchValue({
          [SupplierManufacturerFormField.NAME]: config.prefill.name ?? "",
          [SupplierManufacturerFormField.TYPE]: config.prefill.type ?? null,
        });
      }
    }
    this.loadShipmentMethods();
  }

  createEdit() {
    if (this.form.invalid) {
      return;
    }

    const name = this.form.get(SupplierManufacturerFormField.NAME)
      ?.value as string;
    const code = this.form.get(SupplierManufacturerFormField.CODE)?.value;
    const shipmentMethodId = this.form.get(
      SupplierManufacturerFormField.SHIPMENT_METHOD,
    )?.value as string | undefined;
    const type = this.form.get(SupplierManufacturerFormField.TYPE)
      ?.value as SupplierAndManufacturerType;
    const body: SupplierAndManufacturerCreate | SupplierAndManufacturerUpdate =
      {
        name,
        code,
        shipmentMethodId,
        type,
      };
    if (this.editMode()) {
      this.supplierManufacturerRepo
        .updateSupplierManufacturer(this.itemEdited!.uid, body)
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
      this.supplierManufacturerRepo
        .createSupplierManufacturer(body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage("Entry created");
            this.closeDialog(true);
          },
        });
    }
  }

  private initTypeOptions() {
    this.typeOptions.set(
      this.enumTransformer.enumToLabelValue(
        SupplierAndManufacturerType,
        (value: SupplierAndManufacturerType) =>
          this.supplierAndManufacturerTypePipe.transform(value),
      ),
    );
  }

  private loadShipmentMethods() {
    this.shipmentMethodRepo
      .listAllShipmentMethods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.shipmentMethods.set(result);
          this.setDefaultShipmentMethod();
        },
      });
  }

  private setDefaultShipmentMethod() {
    const shipmentControl = this.form.get(
      SupplierManufacturerFormField.SHIPMENT_METHOD,
    );
    if (!shipmentControl || !this.itemEdited || !this.itemEdited.shipmentMethod)
      return;
    const defaultSM = this.shipmentMethods().find(
      (sm) => sm.uid === this.itemEdited?.shipmentMethod?.uid,
    );
    if (defaultSM) {
      shipmentControl.setValue(defaultSM.uid);
    }
  }
}
