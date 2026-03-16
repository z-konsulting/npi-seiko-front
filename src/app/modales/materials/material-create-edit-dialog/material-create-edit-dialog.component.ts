import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { QueryParamKey } from "../../../models/enums/queryParamKey";
import { Button } from "primeng/button";
import {
  MaterialFormField,
  MaterialSupplierFormField,
  MaterialSupplierMoqLineFormField,
} from "../../../models/enums/form-field-names/material-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Currency,
  Material,
  MaterialCategory,
  MaterialCreate,
  MaterialSupplierCreate,
  MaterialSupplierMoqLineCreate,
  MaterialType,
  MaterialUpdate,
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
  Unit,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { Select } from "primeng/select";
import { Chip } from "primeng/chip";
import { MaterialRepo } from "../../../repositories/material.repo";
import { MaterialTypePipe } from "../../../pipes/material-type.pipe";
import { EnumTransformerService } from "../../../services/components/enum-transformer.service";
import { UnitRepo } from "../../../repositories/unit.repo";
import { MaterialSupplierLinesComponent } from "./material-supplier-lines/material-supplier-lines.component";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { MaterialCategoryRepo } from "../../../repositories/material-category-repo.service";
import { SupplierManufacturerRepo } from "../../../repositories/supplier-manufacturer.repo";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "app-material-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    Select,
    MaterialSupplierLinesComponent,
    Chip,
    Tooltip,
  ],
  templateUrl: "./material-create-edit-dialog.component.html",
  styleUrl: "./material-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MaterialTypePipe],
})
export class MaterialCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  materialForm!: FormGroup;
  materialEdited?: Material;
  materialType!: MaterialType;
  editMode = signal<boolean>(false);
  manufacturers = signal<SupplierAndManufacturer[]>([]);
  materialCategories = signal<MaterialCategory[]>([]);
  units = signal<Unit[]>([]);
  currencies = signal<Currency[]>([]);
  suppliers = signal<SupplierAndManufacturer[]>([]);
  materialTypeOptions: { label: string; value: string }[] = [];

  protected readonly Icons = Icons;
  protected readonly MaterialFormField = MaterialFormField;

  private materialRepo = inject(MaterialRepo);
  private materialCategoryRepo = inject(MaterialCategoryRepo);
  private unitRepo = inject(UnitRepo);
  private currencyRepo = inject(CurrencyRepo);
  private supplierManufacturerRepo = inject(SupplierManufacturerRepo);
  private readonly materialTypePipe = inject(MaterialTypePipe);
  private readonly enumTransformer = inject(EnumTransformerService);
  private readonly router = inject(Router);

  constructor() {
    super();
  }

  get suppliersFormArray(): FormArray {
    return this.materialForm.get(MaterialFormField.SUPPLIER) as FormArray;
  }

  checkIfDraftBlockVisible(): boolean {
    return (
      this.editMode() &&
      ((!this.materialEdited?.manufacturer &&
        !!this.materialEdited?.draftManufacturerName) ||
        (!this.materialEdited?.category &&
          !!this.materialEdited?.draftCategoryName) ||
        (!this.materialEdited?.unit && !!this.materialEdited?.draftUnitName))
    );
  }

  ngOnInit() {
    this.loadManufacturers();
    this.loadMaterialCategories();
    this.loadUnits();
    this.loadCurrencies();
    this.loadSuppliers();
    this.initializeEnumOptions();

    if (this.config.data) {
      const config = this.config.data;
      this.materialType = config.materialType;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.materialEdited = this.config.data.material;
      }
    }
    this.materialForm = this.formService.buildMaterialForm(
      this.editMode(),
      this.materialEdited,
    );
  }

  initializeEnumOptions() {
    this.materialTypeOptions = this.enumTransformer.enumToLabelValue(
      MaterialType,
      (value: MaterialType) => this.materialTypePipe.transform(value),
    );
  }

  loadCurrencies() {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currencies) => {
        this.currencies.set(currencies);
      });
  }

  loadSuppliers() {
    this.supplierManufacturerRepo
      .listAllSupplierManufacturers(SupplierAndManufacturerType.SUPPLIER)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((suppliers) => {
        this.suppliers.set(suppliers);
      });
  }

  loadManufacturers() {
    this.supplierManufacturerRepo
      .listAllSupplierManufacturers(SupplierAndManufacturerType.MANUFACTURER)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((manufacturers) => {
        this.manufacturers.set(manufacturers);
      });
  }

  loadMaterialCategories() {
    this.materialCategoryRepo
      .listAllMaterialCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.materialCategories.set(categories);
      });
  }

  loadUnits() {
    this.unitRepo
      .listAllUnits()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((units) => {
        this.units.set(units);
        if (this.editMode() && this.materialEdited?.unit) {
          const matchedUnit =
            units.find((u) => u.name === this.materialEdited!.unit) ?? null;
          this.materialForm.get(MaterialFormField.UNIT)?.setValue(matchedUnit);
        }
      });
  }

  onSubmit() {
    this.formService.trimFormStringValues(this.materialForm);

    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      this.handleMessage.warningMessage("Please fill all required fields");
      return;
    }

    const manufacturer: SupplierAndManufacturer = this.materialForm.get(
      MaterialFormField.MANUFACTURER,
    )?.value;
    const category: MaterialCategory | undefined = this.materialForm.get(
      MaterialFormField.CATEGORY,
    )?.value;
    const body: MaterialCreate | MaterialUpdate = {
      manufacturerId: manufacturer.uid,
      manufacturerPartNumber: this.materialForm.get(
        MaterialFormField.MANUFACTURER_PART_NUMBER,
      )?.value,
      description: this.materialForm.get(MaterialFormField.DESCRIPTION)?.value,
      categoryId: category?.uid ?? undefined,
      unitId: (
        this.materialForm.get(MaterialFormField.UNIT)?.value as Unit | null
      )?.uid,
      materialType: this.materialType,
    };
    if (this.editMode()) {
      this.updateMaterial(body);
    } else {
      const suppliers: MaterialSupplierCreate[] =
        this.suppliersFormArray.controls.map((supplierControl) => {
          const supplierForm = supplierControl as FormGroup;
          const currency: Currency = supplierForm.get(
            MaterialSupplierFormField.PURCHASING_CURRENCY,
          )?.value;
          const supplier: SupplierAndManufacturer | undefined =
            supplierForm.get(MaterialSupplierFormField.SUPPLIER)?.value;
          const moqLinesArray = supplierForm.get(
            MaterialSupplierFormField.MOQ_LINES,
          ) as FormArray;
          const moqLines: MaterialSupplierMoqLineCreate[] =
            moqLinesArray.controls.map((moqControl) => {
              const moqForm = moqControl as FormGroup;
              return {
                minimumOrderQuantity: moqForm.get(
                  MaterialSupplierMoqLineFormField.MINIMUM_ORDER_QUANTITY,
                )?.value,
                unitPurchasingPriceInPurchasingCurrency: moqForm.get(
                  MaterialSupplierMoqLineFormField.PRICE,
                )?.value,
                leadTime: moqForm.get(
                  MaterialSupplierMoqLineFormField.LEAD_TIME,
                )?.value,
              };
            });

          return {
            purchasingCurrencyId: currency.uid,
            moqLines: moqLines,
            defaultSupplier: supplierForm.get(
              MaterialSupplierFormField.DEFAULT_SUPPLIER,
            )?.value,
            supplierId: supplier?.uid,
          } as MaterialSupplierCreate;
        });
      const bodyCreate: MaterialCreate = {
        ...body,
        suppliers,
      };
      this.createMaterial(bodyCreate);
    }
  }

  navigateToCreateManufacturer(draftName: string | undefined): void {
    if (!draftName) return;
    this.closeDialog();
    this.router.navigate(
      [RoutingService.getFullPath(RouteId.ADMIN_SUPPLIERS_MANUFACTURERS)],
      { queryParams: { [QueryParamKey.MANUFACTURER_NAME]: draftName } },
    );
  }

  navigateToCreateCategory(draftName: string | undefined): void {
    if (!draftName) return;
    this.closeDialog();
    this.router.navigate(
      [RoutingService.getFullPath(RouteId.ADMIN_MATERIAL_CATEGORIES)],
      { queryParams: { [QueryParamKey.CATEGORY_NAME]: draftName } },
    );
  }

  navigateToCreateUnit(draftName: string | undefined): void {
    if (!draftName) return;
    this.closeDialog();
    this.router.navigate([RoutingService.getFullPath(RouteId.ADMIN_UNITS)], {
      queryParams: { [QueryParamKey.UNIT_NAME]: draftName },
    });
  }

  createMaterial(body: MaterialCreate) {
    this.materialRepo
      .createMaterial(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Material created successfully");
          this.closeDialog(true);
        },
      });
  }

  updateMaterial(body: MaterialUpdate) {
    this.materialRepo
      .updateMaterial(this.materialEdited!.uid, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Material updated successfully");
          this.closeDialog(true);
        },
      });
  }
}
