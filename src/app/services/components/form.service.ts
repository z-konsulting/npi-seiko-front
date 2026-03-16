import { Injectable } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { ToolingRejectFormField } from "../../models/enums/form-field-names/tooling-reject-form-field";
import {
  GenerateQuotationPdfFormField,
  QuotationLineExtraInfoFormField,
} from "../../models/enums/form-field-names/generate-quotation-pdf-form-field";
import { UserFormField } from "../../models/enums/form-field-names/user-form-field";
import { CustomerFormField } from "../../models/enums/form-field-names/customer-form-field";
import { ProductNameFormField } from "../../models/enums/form-field-names/product-name-form-field";
import { SupplierManufacturerFormField } from "../../models/enums/form-field-names/supplier-manufacturer-form-field";
import {
  MaterialFormField,
  MaterialSupplierFormField,
  MaterialSupplierMoqLineFormField,
} from "../../models/enums/form-field-names/material-form-field";
import { MaterialCategoryFormField } from "../../models/enums/form-field-names/material-category-form-field";
import {
  CurrencyFormField,
  ExchangeRateFormField,
} from "../../models/enums/form-field-names/currency-form-field";
import { ProcessFormField } from "../../models/enums/form-field-names/process-form-field";
import { ShipmentMethodFormField } from "../../models/enums/form-field-names/shipment-method-form-field";
import { UnitFormField } from "../../models/enums/form-field-names/unit-form-field";
import { ShipmentLocationFormField } from "../../models/enums/form-field-names/shipment-location-form-field";
import { BomConfigFormField } from "../../models/enums/form-field-names/bom-configuration-form-field";
import {
  CostRequestFormField,
  CostRequestLineFormField,
  CostRequestLineMaterialFormField,
} from "../../models/enums/form-field-names/cost-request-form-field";
import { recordToMap } from "../../models/recordToMap";
import {
  CostingMethodType,
  CostRequest,
  CostRequestLine,
  Currency,
  Customer,
  FileInfo,
  Material,
  MaterialCategory,
  MaterialCostLine,
  MaterialSupplier,
  MaterialSupplierMoqLine,
  MaterialType,
  ProductName,
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
  Unit,
  UserRole,
  UserType,
} from "../../../client/costSeiko";
import { DateFormField } from "../../models/enums/date-form-field";
import { LeadTimeType } from "../../models/lead-time-type";

@Injectable({
  providedIn: "root",
})
export class FormService {
  constructor(private fb: FormBuilder) {}

  trimFormStringValues(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control) {
        if (control instanceof FormGroup) {
          this.trimFormStringValues(control);
        } else if (typeof control.value === "string") {
          const trimmedValue = control.value.trim();
          control.setValue(trimmedValue === "" ? undefined : trimmedValue, {
            emitEvent: false,
          });
        }
      }
    });
  }

  buildDateForm() {
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    return this.fb.group({
      [DateFormField.START_DATE]: new FormControl<Date | null>(twoWeeksAgo, [
        Validators.required,
      ]),
      [DateFormField.END_DATE]: new FormControl<Date | null>(today, [
        Validators.required,
      ]),
    });
  }

  buildUserForm(type: UserType, form?: FormGroup): FormGroup {
    let role = null;
    if (form) {
      role = form.get(UserFormField.ROLE)?.value ?? "";
    }
    const formGroup: FormGroup = this.fb.group({
      [UserFormField.ROLE]: new FormControl<UserRole | null>(role, [
        Validators.required,
      ]),
    });
    if (type === UserType.USERNAME) {
      formGroup.addControl(
        UserFormField.USERNAME,
        new FormControl<string>("", [Validators.required]),
      );
      formGroup.addControl(
        UserFormField.PASSWORD,
        new FormControl<string>("", [Validators.required]),
      );
    } else {
      formGroup.addControl(
        UserFormField.EMAIL,
        new FormControl<string>("", [Validators.required, Validators.email]),
      );
    }
    return formGroup;
  }

  buildCustomerForm(customer?: Customer): FormGroup {
    return this.fb.group({
      [CustomerFormField.NAME]: new FormControl<string>(customer?.name ?? "", [
        Validators.required,
      ]),
      [CustomerFormField.CODE]: new FormControl<string>(customer?.code ?? "", [
        Validators.required,
      ]),
      [CustomerFormField.DYSON]: new FormControl<boolean>(
        customer?.dyson ?? false,
      ),
      [CustomerFormField.MARK_UP]: new FormControl<number | null>(
        customer?.markup ?? null,
      ),
      [CustomerFormField.PAYMENT_TERMS]: new FormControl<string | null>(
        customer?.paymentTerms ?? null,
      ),
    });
  }

  buildProductNameForm(): FormGroup {
    return this.fb.group({
      [ProductNameFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [ProductNameFormField.CODE]: new FormControl<string>("", [
        Validators.required,
      ]),
    });
  }

  buildSupplierManufacturerForm(): FormGroup {
    return this.fb.group({
      [SupplierManufacturerFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [SupplierManufacturerFormField.CODE]: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      [SupplierManufacturerFormField.SHIPMENT_METHOD]: new FormControl<
        string | null
      >(null),
      [SupplierManufacturerFormField.TYPE]:
        new FormControl<SupplierAndManufacturerType | null>(null, [
          Validators.required,
        ]),
    });
  }

  buildMaterialCategoryForm(): FormGroup {
    return this.fb.group({
      [MaterialCategoryFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [MaterialCategoryFormField.ABBREVIATION]: new FormControl<string>("", [
        Validators.required,
      ]),
    });
  }

  buildMaterialForm(editMode: boolean, material?: Material): FormGroup {
    return this.fb.group({
      [MaterialFormField.MANUFACTURER]:
        new FormControl<SupplierAndManufacturer | null>(
          material?.manufacturer ?? null,
          [Validators.required],
        ),

      [MaterialFormField.MANUFACTURER_PART_NUMBER]: new FormControl<string>(
        material?.manufacturerPartNumber ?? "",
        [Validators.required],
      ),

      [MaterialFormField.DESCRIPTION]: new FormControl<string>(
        material?.description ?? "",
      ),

      [MaterialFormField.CATEGORY]: new FormControl<MaterialCategory | null>(
        material?.category ?? null,
        [Validators.required],
      ),

      [MaterialFormField.UNIT]: new FormControl<Unit | null>(null),

      ...(!editMode
        ? {
            [MaterialFormField.SUPPLIER]: this.fb.array(
              [this.buildMaterialSupplierForm()],
              [
                Validators.required,
                Validators.minLength(1),
                this.atLeastOneChosen,
              ],
            ),
          }
        : {}),
    });
  }

  buildMaterialSupplierForm(materialSupp?: MaterialSupplier): FormGroup {
    return this.fb.group({
      [MaterialSupplierFormField.SUPPLIER]:
        new FormControl<SupplierAndManufacturer | null>(
          materialSupp?.supplier ?? null,
          [Validators.required],
        ),
      [MaterialSupplierFormField.PURCHASING_CURRENCY]:
        new FormControl<Currency | null>(
          materialSupp?.purchasingCurrency ?? null,
          [Validators.required],
        ),
      [MaterialSupplierFormField.SHIPMENT_METHOD]: new FormControl<
        string | null
      >({
        value: materialSupp?.supplier?.shipmentMethod?.name ?? null,
        disabled: true,
      }),
      [MaterialSupplierFormField.DEFAULT_SUPPLIER]: new FormControl<boolean>(
        materialSupp?.defaultSupplier ?? false,
        [Validators.required],
      ),
      [MaterialSupplierFormField.MOQ_LINES]: this.fb.array(
        materialSupp?.moqLines?.map((moqLine) =>
          this.buildMaterialSupplierMoqLineForm(moqLine),
        ) ?? [this.buildMaterialSupplierMoqLineForm()],
        [Validators.required, Validators.minLength(1)],
      ),
    });
  }

  buildMaterialSupplierMoqLineForm(
    moqLine?: MaterialSupplierMoqLine,
  ): FormGroup {
    return this.fb.group({
      [MaterialSupplierMoqLineFormField.MINIMUM_ORDER_QUANTITY]:
        new FormControl<number | null>(
          moqLine?.minimumOrderQuantity ? moqLine?.minimumOrderQuantity : null,
          [Validators.required, Validators.min(0.0001)],
        ),
      [MaterialSupplierMoqLineFormField.PRICE]: new FormControl<number | null>(
        moqLine?.unitPurchasingPriceInPurchasingCurrency
          ? moqLine?.unitPurchasingPriceInPurchasingCurrency
          : null,
        [Validators.required, Validators.min(0.0001)],
      ),
      [MaterialSupplierMoqLineFormField.LEAD_TIME]: new FormControl<string>(
        moqLine?.leadTime ?? "",
      ),
    });
  }

  buildCurrencyForm(): FormGroup {
    return this.fb.group({
      [CurrencyFormField.CODE]: new FormControl<string>("", [
        Validators.required,
      ]),
      [CurrencyFormField.EXCHANGE_RATES]: this.fb.array([]),
    });
  }

  buildExchangeRateFormGroup(toCurrencyUid: string, rate?: number): FormGroup {
    return this.fb.group({
      [ExchangeRateFormField.TO_CURRENCY_UID]: new FormControl<string>(
        toCurrencyUid,
        [Validators.required],
      ),
      [ExchangeRateFormField.RATE]: new FormControl<number | null>(
        rate ?? null,
        [Validators.required, Validators.min(0)],
      ),
    });
  }

  buildProcessForm(): FormGroup {
    return this.fb.group({
      [ProcessFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [ProcessFormField.CURRENCY_UID]: new FormControl<Currency | null>(null, [
        Validators.required,
      ]),
      [ProcessFormField.COST_PER_SECOND]: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0),
      ]),
      [ProcessFormField.DYSON_CYCLE_TIME_IN_SECONDS]: new FormControl<
        number | null
      >(null, [Validators.required, Validators.min(0)]),
      [ProcessFormField.NON_DYSON_CYCLE_TIME_IN_SECONDS]: new FormControl<
        number | null
      >(null, [Validators.required, Validators.min(0)]),
      [ProcessFormField.SETUP_PROCESS]: new FormControl<boolean>(false),
    });
  }

  buildUnitForm(): FormGroup {
    return this.fb.group({
      [UnitFormField.NAME]: new FormControl<string>("", [Validators.required]),
    });
  }

  buildShipmentLocationForm(): FormGroup {
    return this.fb.group({
      [ShipmentLocationFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [ShipmentLocationFormField.ACCEPTED_CURRENCIES]: new FormControl<
        string[]
      >([]),
    });
  }

  buildBomConfigurationForm(): FormGroup {
    return this.fb.group({
      [BomConfigFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [BomConfigFormField.PART_NUMBER_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.PART_NUMBER_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.PART_NUMBER_ROW]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.REVISION_SHEET]: new FormControl<number | null>(null),
      [BomConfigFormField.REVISION_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.REVISION_ROW]: new FormControl<number | null>(null),
      [BomConfigFormField.DESCRIPTION_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.DESCRIPTION_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.DESCRIPTION_ROW]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MATERIALS_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MATERIALS_START_ROW]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MFG_NAME_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MFG_PN_COLUMN]: new FormControl<number | null>(null),
      [BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN]: new FormControl<
        number | null
      >(null),
      [BomConfigFormField.QUANTITY_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.UNIT_COLUMN]: new FormControl<number | null>(null),
    });
  }

  buildShipmentMethodForm(): FormGroup {
    return this.fb.group({
      [ShipmentMethodFormField.NAME]: new FormControl<string>("", [
        Validators.required,
      ]),
      [ShipmentMethodFormField.PERCENTAGE]: new FormControl<number | null>(
        null,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ),
    });
  }

  buildCostRequestForm(editMode: boolean, cost?: CostRequest): FormGroup {
    let formGroup: FormGroup = this.fb.group({
      // customer initialize in component after reloading customer
      [CostRequestFormField.CURRENCY]: new FormControl<Currency | null>(null, [
        Validators.required,
      ]),
      [CostRequestFormField.CUSTOMER]: new FormControl<Customer | null>(null, [
        Validators.required,
      ]),
      [CostRequestFormField.CUSTOMER_EMAILS]: new FormControl<string[]>(
        cost?.customerEmails ?? [],
      ),
      [CostRequestFormField.REQUESTOR_NAME]: new FormControl<string>(
        cost?.requestorName ?? "",
        [],
      ),
      [CostRequestFormField.PROJECT_NAME]: new FormControl<string>(
        cost?.projectName ?? "",
        [Validators.required],
      ),
      [CostRequestFormField.PURCHASE_ORDER_EXPECTED_DATE]:
        new FormControl<Date>(
          cost?.purchaseOrderExpectedDate
            ? new Date(cost.purchaseOrderExpectedDate)
            : new Date(),
          [Validators.required],
        ),
    });
    // only add lines when creating a new cost request
    // for edit, user can only update the main data
    if (!editMode) {
      formGroup.addControl(CostRequestFormField.LINES, this.fb.array([], []));
    }
    return formGroup;
  }

  buildCostRequestLineForm(line?: CostRequestLine): FormGroup {
    return this.fb.group({
      [CostRequestLineFormField.CUSTOMER_PART_NUMBER]: new FormControl<string>(
        line?.customerPartNumber ?? "",
        [Validators.required],
      ),
      [CostRequestLineFormField.CUSTOMER_PART_NUMBER_REVISION]:
        new FormControl<string>(line?.customerPartNumberRevision ?? "", [
          Validators.required,
        ]),
      [CostRequestLineFormField.DESCRIPTION]: new FormControl<string>(
        line?.description ?? "",
      ),
      [CostRequestLineFormField.PRODUCT_NAME]:
        new FormControl<ProductName | null>(line?.productName ?? null),
      [CostRequestLineFormField.QUANTITIES]: new FormControl<string[]>(
        line?.quantities?.map((q) => q.toString()) ?? [],
        [Validators.required, Validators.minLength(1)],
      ),
      [CostRequestLineFormField.CR_METHOD_TYPE]:
        new FormControl<CostingMethodType>(
          line?.costingMethodType ?? CostingMethodType.HV,
          [Validators.required],
        ),
      [CostRequestLineFormField.FILES]: new FormControl<FileInfo[]>([]),
      [CostRequestLineFormField.MATERIAL_LINES]: this.fb.array([]),
    });
  }

  buildCostRequestLineMaterialForm(material?: MaterialCostLine): FormGroup {
    return this.fb.group({
      [CostRequestLineMaterialFormField.MATERIAL_EXISTS]:
        new FormControl<boolean>(!!material?.manufacturer),
      [CostRequestLineMaterialFormField.MANUFACTURER]: new FormControl<string>(
        material?.manufacturer?.name ?? "",
        [Validators.required],
      ),
      [CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER]:
        new FormControl<string>(material?.manufacturerPartNumber ?? "", [
          Validators.required,
        ]),
      [CostRequestLineMaterialFormField.DESCRIPTION]: new FormControl<string>(
        material?.description ?? "",
      ),
      [CostRequestLineMaterialFormField.CATEGORY]: new FormControl<string>(
        material?.category?.name ?? "",
      ),
      [CostRequestLineMaterialFormField.UNIT]: new FormControl<string>(
        material?.unit ?? "",
      ),
      [CostRequestLineMaterialFormField.MATERIAL_TYPE]:
        new FormControl<MaterialType>(
          material?.materialType ?? MaterialType.DIRECT,
          [Validators.required],
        ),
      [CostRequestLineMaterialFormField.QUANTITY]: new FormControl<
        number | null
      >(material?.quantity ?? null, [
        Validators.required,
        Validators.min(0.0001),
      ]),
    });
  }

  formatEnumToReadableLabels(
    enumObj: Record<string, string>,
  ): Map<string, string> {
    const record = Object.values(enumObj).reduce(
      (acc, value) => {
        acc[value] = value
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()
          .replace(/^./, (str) => str.toUpperCase());
        return acc;
      },
      {} as Record<string, string>,
    );
    return recordToMap(record);
  }

  clearValidators(control: AbstractControl | null) {
    if (control) {
      control.clearValidators();
      control.clearAsyncValidators();
      control.setErrors(null);
      control.updateValueAndValidity();
    }
  }

  setRequired(control: AbstractControl | null) {
    if (control) {
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
    }
  }

  getFormValueExistId(key: any, formGroup: FormGroup): boolean {
    const moldId = formGroup.get(key)?.value;
    return moldId && moldId.trim() !== "";
  }

  buildToolingRejectForm(): FormGroup {
    return this.fb.group({
      [ToolingRejectFormField.REJECT_REASON]: new FormControl<string>("", [
        Validators.required,
      ]),
    });
  }

  buildGenerateQuotationPdfForm(): FormGroup {
    return this.fb.group({
      [GenerateQuotationPdfFormField.PAYMENT_TERMS]: new FormControl<string>(
        "",
        [Validators.required],
      ),
      [GenerateQuotationPdfFormField.PREPARED_BY]: new FormControl<string>("", [
        Validators.required,
      ]),
      [GenerateQuotationPdfFormField.APPROVED_BY]: new FormControl<string>("", [
        Validators.required,
      ]),
      [GenerateQuotationPdfFormField.GLOBAL_COMMENT]: new FormControl<string>(
        "",
      ),
      [GenerateQuotationPdfFormField.LINE_EXTRA_INFOS]: this.fb.array([]),
    });
  }

  buildQuotationLineExtraInfoForm(): FormGroup {
    return this.fb.group({
      [QuotationLineExtraInfoFormField.LEAD_TIME_VALUE]: new FormControl<
        number | null
      >(null),
      [QuotationLineExtraInfoFormField.LEAD_TIME_UNIT]:
        new FormControl<LeadTimeType>("weeks"),
      [QuotationLineExtraInfoFormField.REMARKS]: new FormControl<string>(""),
    });
  }

  private atLeastOneItemRequired(
    control: AbstractControl,
  ): ValidationErrors | null {
    if (control instanceof Array || !control) return null; // sécurité

    const array = control as any;
    return array.controls.length > 0 ? null : { required: true };
  }

  private atLeastOneChosen(control: AbstractControl): ValidationErrors | null {
    if (control instanceof Array || !control) return null;

    const array = control as any;
    const chosenCount = array.controls.filter(
      (supplierControl: AbstractControl) =>
        supplierControl.get(MaterialSupplierFormField.DEFAULT_SUPPLIER)
          ?.value === true,
    ).length;

    if (chosenCount === 0) {
      return { noChosenSupplier: true };
    }
    if (chosenCount > 1) {
      return { multipleChosenSuppliers: true };
    }
    return null;
  }
}
