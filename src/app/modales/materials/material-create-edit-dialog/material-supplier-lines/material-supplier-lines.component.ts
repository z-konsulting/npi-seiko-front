import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  OnInit,
} from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";
import { NgClass } from "@angular/common";
import { Button } from "primeng/button";
import { Icons } from "../../../../models/enums/icons";
import { Tooltip } from "primeng/tooltip";
import {
  MaterialFormField,
  MaterialSupplierFormField,
  MaterialSupplierMoqLineFormField,
} from "../../../../models/enums/form-field-names/material-form-field";
import { NoDoubleClickDirective } from "../../../../directives/no-double-click.directive";
import { InputContainerComponent } from "../../../../components/input-container/input-container.component";
import { BaseModal } from "../../../../models/classes/base-modal";
import { Select } from "primeng/select";
import { Currency, SupplierAndManufacturer } from "../../../../../client/costSeiko";
import { Checkbox } from "primeng/checkbox";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";

@Component({
  selector: "app-material-supplier-lines",
  imports: [
    ReactiveFormsModule,
    Accordion,
    AccordionPanel,
    NgClass,
    AccordionHeader,
    Button,
    AccordionContent,
    Tooltip,
    NoDoubleClickDirective,
    InputContainerComponent,
    Select,
    Checkbox,
    InputNumber,
    InputText,
  ],
  templateUrl: "./material-supplier-lines.component.html",
  styleUrl: "./material-supplier-lines.component.scss",
})
export class MaterialSupplierLinesComponent
  extends BaseModal
  implements OnInit
{
  validated = input(false);
  materialForm = input.required<FormGroup>();
  currencies = input.required<Currency[]>();
  suppliers = input.required<SupplierAndManufacturer[]>();
  showAccordion: boolean = false;
  activeIndex?: number;

  protected readonly Icons = Icons;
  protected readonly MaterialSupplierFormField = MaterialSupplierFormField;
  protected readonly MaterialSupplierMoqLineFormField =
    MaterialSupplierMoqLineFormField;
  protected readonly MaterialFormField = MaterialFormField;
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    super();
    // Watch for chosen changes and auto-open accordion
    effect(() => {
      const form = this.materialForm();
      let defaultOpenIndex = 0;
      if (form) {
        this.suppliersFormArray.controls.forEach((control, index) => {
          defaultOpenIndex = index;
        });
      }
      setTimeout(() => {
        this.showAccordion = true;
        // Open first supplier by default
        this.activeIndex = defaultOpenIndex;
      }, 100);
    });
    effect(() => {
      const currencies = this.currencies();
      const form = this.materialForm();
      if (currencies && currencies.length > 0 && form) {
        this.setDefaultCurrency();
      }
    });
  }

  get suppliersFormArray(): FormArray {
    return this.materialForm().get(MaterialFormField.SUPPLIER) as FormArray;
  }

  ngOnInit() {}

  getSupplierForm(index: number): FormGroup {
    return this.suppliersFormArray.at(index) as FormGroup;
  }

  getMoqLinesFormArray(supplierIndex: number): FormArray {
    return this.getSupplierForm(supplierIndex).get(
      MaterialSupplierFormField.MOQ_LINES,
    ) as FormArray;
  }

  addSupplier() {
    const supplierForm = this.formService.buildMaterialSupplierForm();
    this.suppliersFormArray.push(supplierForm);
    // Auto-open the new supplier
    this.openLastSupplier();
    this.activeIndex = this.suppliersFormArray.length - 1;
    this.cdr.detectChanges();
  }

  copySupplier(supplierIndex: number, event: any) {
    const supplierForm = this.getSupplierForm(supplierIndex);
    const newSupplierForm =
      this.formService.buildMaterialSupplierForm() as FormGroup;
    newSupplierForm.patchValue(supplierForm.value);
    // Reset chosen to false for copied supplier
    newSupplierForm
      .get(MaterialSupplierFormField.DEFAULT_SUPPLIER)
      ?.setValue(false);
    this.suppliersFormArray.push(newSupplierForm);
    event.stopPropagation();
    this.openLastSupplier();
    this.cdr.detectChanges();
  }

  removeSupplier(index: number) {
    this.suppliersFormArray.removeAt(index);
    this.cdr.detectChanges();
  }

  onSupplierChange(supplierIndex: number) {
    const supplierForm = this.getSupplierForm(supplierIndex);
    const supplier: SupplierAndManufacturer = supplierForm.get(
      MaterialSupplierFormField.SUPPLIER,
    )?.value;
    if (supplier) {
      supplierForm
        .get(MaterialSupplierFormField.SHIPMENT_METHOD)
        ?.setValue(supplier.shipmentMethod?.name);
    }
  }

  onSupplierClear(supplierIndex: number) {
    const supplierForm = this.getSupplierForm(supplierIndex);
    supplierForm.get(MaterialSupplierFormField.SHIPMENT_METHOD)?.reset();
  }

  confirmRemoveSupplier(
    supplier: AbstractControl<any>,
    index: number,
    event: any,
  ): void {
    const supplierName =
      supplier.get(MaterialSupplierFormField.SUPPLIER)?.value?.name ??
      "this supplier";
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${supplierName}?`,
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: {
        label: "No",
        outlined: true,
      },
      accept: () => {
        this.removeSupplier(index);
      },
    });
    event.stopPropagation();
  }

  addMoqLine(supplierIndex: number) {
    const moqLinesArray = this.getMoqLinesFormArray(supplierIndex);
    const moqLineForm = this.formService.buildMaterialSupplierMoqLineForm();
    moqLinesArray.push(moqLineForm);
  }

  removeMoqLine(supplierIndex: number, moqIndex: number) {
    const moqLinesArray = this.getMoqLinesFormArray(supplierIndex);
    moqLinesArray.removeAt(moqIndex);
  }

  onChosenChange(supplierIndex: number, event: any) {
    const checked = event.checked;
    if (checked) {
      // Uncheck all other suppliers
      this.suppliersFormArray.controls.forEach((control, index) => {
        if (index !== supplierIndex) {
          control
            .get(MaterialSupplierFormField.DEFAULT_SUPPLIER)
            ?.setValue(false);
        }
      });
      // Auto-open the chosen supplier
      if (!this.activeIndex || !(this.activeIndex === supplierIndex)) {
        this.activeIndex = supplierIndex;
        this.cdr.detectChanges();
      }
    }
  }

  private openLastSupplier() {
    this.activeIndex = this.suppliersFormArray.length - 1;
  }

  private setDefaultCurrency() {
    this.suppliersFormArray.controls.forEach((control) => {
      const currencyControl = control?.get(
        MaterialSupplierFormField.PURCHASING_CURRENCY,
      );
      if (currencyControl) {
        const currency: Currency = currencyControl.value;
        if (currency && currency.uid) {
          const defaultCurrency = this.currencies().find(
            (c) => c.uid === currency.uid,
          );
          if (defaultCurrency) {
            currencyControl.setValue(defaultCurrency);
          }
        } else {
          currencyControl.setValue(this.currencies()[0]);
        }
      }
    });
  }
}
