import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormArray, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Select } from "primeng/select";
import { Checkbox } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseModal } from "../../../models/classes/base-modal";
import { Icons } from "../../../models/enums/icons";
import {
  MaterialSupplierFormField,
  MaterialSupplierMoqLineFormField,
} from "../../../models/enums/form-field-names/material-form-field";
import {
  Currency,
  MaterialSupplier,
  MaterialSupplierCreate,
  MaterialSupplierMoqLineCreate,
  SupplierAndManufacturer,
} from "../../../../client/costSeiko";
import { MaterialRepo } from "../../../repositories/material.repo";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";

@Component({
  selector: "app-material-supplier-form-dialog",
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    Checkbox,
    TooltipModule,
    InputContainerComponent,
    NoDoubleClickDirective,
  ],
  templateUrl: "./material-supplier-form-dialog.component.html",
  styleUrl: "./material-supplier-form-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialSupplierFormDialogComponent
  extends BaseModal
  implements OnInit
{
  form!: FormGroup;
  editMode = signal<boolean>(false);
  currencies = signal<Currency[]>([]);
  suppliers = signal<SupplierAndManufacturer[]>([]);

  protected readonly Icons = Icons;
  protected readonly MaterialSupplierFormField = MaterialSupplierFormField;
  protected readonly MaterialSupplierMoqLineFormField =
    MaterialSupplierMoqLineFormField;
  protected readonly RegexPatterns = RegexPatterns;
  private materialRepo = inject(MaterialRepo);
  private materialUid!: string;
  private materialSupplierUid: string | null = null;

  get moqLinesFormArray(): FormArray {
    return this.form.get(MaterialSupplierFormField.MOQ_LINES) as FormArray;
  }

  ngOnInit(): void {
    this.materialUid = this.dataConfig.materialUid;
    this.currencies.set(this.dataConfig.currencies ?? []);
    this.suppliers.set(this.dataConfig.suppliers ?? []);

    const materialSupplier: MaterialSupplier | undefined =
      this.dataConfig.materialSupplier;
    this.editMode.set(!!materialSupplier);

    if (materialSupplier) {
      this.materialSupplierUid = materialSupplier.uid;
    }

    this.form = this.formService.buildMaterialSupplierForm(materialSupplier);

    if (this.currencies().length > 0) {
      const existingUid = materialSupplier?.purchasingCurrency?.uid;
      const currencyToSet = existingUid
        ? (this.currencies().find((c) => c.uid === existingUid) ??
          this.currencies()[0])
        : this.currencies()[0];
      this.form
        .get(MaterialSupplierFormField.PURCHASING_CURRENCY)
        ?.setValue(currencyToSet);
    }
  }

  onSupplierChange(): void {
    const supplier: SupplierAndManufacturer | null = this.form.get(
      MaterialSupplierFormField.SUPPLIER,
    )?.value;
    this.form
      .get(MaterialSupplierFormField.SHIPMENT_METHOD)
      ?.setValue(supplier?.shipmentMethod?.name ?? null);
  }

  onSupplierClear(): void {
    this.form.get(MaterialSupplierFormField.SHIPMENT_METHOD)?.setValue(null);
  }

  addMoqLine(): void {
    this.moqLinesFormArray.push(
      this.formService.buildMaterialSupplierMoqLineForm(),
    );
  }

  removeMoqLine(index: number): void {
    this.moqLinesFormArray.removeAt(index);
  }

  onSubmit(): void {
    this.formService.trimFormStringValues(this.form);

    const supplier: SupplierAndManufacturer = this.form.get(
      MaterialSupplierFormField.SUPPLIER,
    )?.value;
    const currency: Currency = this.form.get(
      MaterialSupplierFormField.PURCHASING_CURRENCY,
    )?.value;
    const moqLines: MaterialSupplierMoqLineCreate[] =
      this.moqLinesFormArray.controls.map((ctrl) => ({
        minimumOrderQuantity: ctrl.get(
          MaterialSupplierMoqLineFormField.MINIMUM_ORDER_QUANTITY,
        )?.value,
        unitPurchasingPriceInPurchasingCurrency: ctrl.get(
          MaterialSupplierMoqLineFormField.PRICE,
        )?.value,
        leadTime:
          ctrl.get(MaterialSupplierMoqLineFormField.LEAD_TIME)?.value || null,
      }));
    const body: MaterialSupplierCreate = {
      supplierId: supplier.uid,
      purchasingCurrencyId: currency.uid,
      moqLines,
      defaultSupplier: this.form.get(MaterialSupplierFormField.DEFAULT_SUPPLIER)
        ?.value,
    };

    const onSuccess = () => {
      this.handleMessage.successMessage(
        this.editMode()
          ? "Supplier updated successfully"
          : "Supplier created successfully",
      );
      this.closeDialog(true);
    };

    if (this.editMode()) {
      this.materialRepo
        .updateMaterialSupplier(
          this.materialUid,
          this.materialSupplierUid!,
          body,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: onSuccess });
    } else {
      this.materialRepo
        .createMaterialSupplier(this.materialUid, body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: onSuccess });
    }
  }
}
