import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePickerModule } from "primeng/datepicker";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NpiOrder, NpiOrderProductionDatesUpdate } from "../../../../client/npiSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { NpiOrderRepo } from "../../../repositories/npi-order.repo";
import { NpiOrderFormField } from "../../../models/enums/form-field-names/npi-order-form-field";
import { Icons } from "../../../models/enums/icons";
import { RegexPatterns } from "../../../services/utils/regex-patterns";

@Component({
  selector: "app-npi-order-production-dates-dialog",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Button,
    CardModule,
    DatePickerModule,
    InputContainerComponent,
  ],
  templateUrl: "./npi-order-production-dates-dialog.component.html",
  styleUrl: "./npi-order-production-dates-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpiOrderProductionDatesDialogComponent extends BaseModal implements OnInit {
  npiOrder = signal<NpiOrder | undefined>(undefined);
  readonly = signal<boolean>(false);
  productionDatesForm = this.formService.buildProductionDatesForm();

  // Cascade min-date / disabled signals
  minMaterialPurchaseDate = signal<Date | null>(null);
  minShippingDate = signal<Date | null>(null);
  minCustomerApprovalDate = signal<Date | null>(null);
  shippingDateDisabled = signal<boolean>(true);
  customerApprovalDateDisabled = signal<boolean>(true);

  protected readonly Icons = Icons;
  protected readonly NpiOrderFormField = NpiOrderFormField;

  private npiOrderRepo = inject(NpiOrderRepo);

  ngOnInit(): void {
    this.npiOrder.set(this.dataConfig.npiOrder as NpiOrder);
    this.readonly.set(this.dataConfig.readonly === true);
    this.productionDatesForm = this.formService.buildProductionDatesForm(this.npiOrder());
    if (this.readonly()) {
      this.productionDatesForm.disable();
    }
    const orderDate = this.npiOrder()?.orderDate;
    this.minMaterialPurchaseDate.set(orderDate ? new Date(orderDate) : null);
    this.computeInitialState();
    this.watchShippingConstraints();
    this.watchCustomerApprovalConstraints();
  }

  submit(): void {
    const form = this.productionDatesForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const materialPurchaseDateValue: Date | null = form.get(NpiOrderFormField.MATERIAL_PURCHASE_ESTIMATED_DATE)?.value ?? null;
    const shippingDateValue: Date | null = form.get(NpiOrderFormField.SHIPPING_ESTIMATED_DATE)?.value ?? null;
    const customerApprovalDateValue: Date | null = form.get(NpiOrderFormField.CUSTOMER_APPROVAL_ESTIMATED_DATE)?.value ?? null;

    const body: NpiOrderProductionDatesUpdate = {
      materialPurchaseEstimatedDate:
        (materialPurchaseDateValue
          ? RegexPatterns.enDateFormatToString(materialPurchaseDateValue)
          : undefined) ?? undefined,
      materialReceivingPlanTimeInDays:
        form.get(NpiOrderFormField.MATERIAL_RECEIVING_PLAN_TIME_IN_DAYS)?.value ?? undefined,
      productionPlanTimeInDays:
        form.get(NpiOrderFormField.PRODUCTION_PLAN_TIME_IN_DAYS)?.value ?? undefined,
      testingPlanTimeInDays:
        form.get(NpiOrderFormField.TESTING_PLAN_TIME_IN_DAYS)?.value ?? undefined,
      shippingEstimatedDate:
        (shippingDateValue
          ? RegexPatterns.enDateFormatToString(shippingDateValue)
          : undefined) ?? undefined,
      customerApprovalEstimatedDate:
        (customerApprovalDateValue
          ? RegexPatterns.enDateFormatToString(customerApprovalDateValue)
          : undefined) ?? undefined,
    };

    this.npiOrderRepo
      .updateNpiOrderProductionDates(this.npiOrder()!.uid, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Production dates updated");
          this.closeDialog(true);
        },
      });
  }

  private computeInitialState(): void {
    this.updateMinShippingDate();
    this.updateShippingDateDisabled();
    this.updateMinCustomerApprovalDate();
    this.updateCustomerApprovalDateDisabled();
  }

  private watchShippingConstraints(): void {
    const fields = [
      NpiOrderFormField.MATERIAL_PURCHASE_ESTIMATED_DATE,
      NpiOrderFormField.MATERIAL_RECEIVING_PLAN_TIME_IN_DAYS,
      NpiOrderFormField.PRODUCTION_PLAN_TIME_IN_DAYS,
      NpiOrderFormField.TESTING_PLAN_TIME_IN_DAYS,
    ];
    fields.forEach((field) => {
      this.productionDatesForm
        .get(field)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.updateMinShippingDate();
          this.updateShippingDateDisabled();
          this.resetShippingAndApprovalDates();
        });
    });
  }

  private watchCustomerApprovalConstraints(): void {
    this.productionDatesForm
      .get(NpiOrderFormField.SHIPPING_ESTIMATED_DATE)
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateMinCustomerApprovalDate();
        this.updateCustomerApprovalDateDisabled();
      });
  }

  private updateMinShippingDate(): void {
    const form = this.productionDatesForm;
    const purchaseDate: Date | null = form.get(NpiOrderFormField.MATERIAL_PURCHASE_ESTIMATED_DATE)?.value;
    const receivingDays: number | null = form.get(NpiOrderFormField.MATERIAL_RECEIVING_PLAN_TIME_IN_DAYS)?.value;
    const productionDays: number | null = form.get(NpiOrderFormField.PRODUCTION_PLAN_TIME_IN_DAYS)?.value;
    const testingDays: number | null = form.get(NpiOrderFormField.TESTING_PLAN_TIME_IN_DAYS)?.value;

    if (!purchaseDate || receivingDays == null || productionDays == null || testingDays == null) {
      this.minShippingDate.set(null);
      return;
    }
    const totalDays = receivingDays + productionDays + testingDays;
    const result = new Date(purchaseDate);
    let remaining = totalDays + 1;
    while (remaining > 0) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) remaining--;
    }
    this.minShippingDate.set(result);
  }

  private updateShippingDateDisabled(): void {
    const form = this.productionDatesForm;
    const allFilled =
      form.get(NpiOrderFormField.MATERIAL_PURCHASE_ESTIMATED_DATE)?.value != null &&
      form.get(NpiOrderFormField.MATERIAL_RECEIVING_PLAN_TIME_IN_DAYS)?.value != null &&
      form.get(NpiOrderFormField.PRODUCTION_PLAN_TIME_IN_DAYS)?.value != null &&
      form.get(NpiOrderFormField.TESTING_PLAN_TIME_IN_DAYS)?.value != null;
    this.shippingDateDisabled.set(!allFilled);
  }

  private updateMinCustomerApprovalDate(): void {
    const shippingDate: Date | null = this.productionDatesForm.get(NpiOrderFormField.SHIPPING_ESTIMATED_DATE)?.value;
    if (!shippingDate) {
      this.minCustomerApprovalDate.set(null);
      return;
    }
    const minDate = new Date(shippingDate);
    minDate.setDate(minDate.getDate() + 1);
    this.minCustomerApprovalDate.set(minDate);
  }

  private updateCustomerApprovalDateDisabled(): void {
    const shippingDate: Date | null = this.productionDatesForm.get(NpiOrderFormField.SHIPPING_ESTIMATED_DATE)?.value;
    this.customerApprovalDateDisabled.set(shippingDate == null);
  }

  private resetShippingAndApprovalDates(): void {
    this.productionDatesForm.get(NpiOrderFormField.SHIPPING_ESTIMATED_DATE)?.setValue(null, { emitEvent: false });
    this.productionDatesForm.get(NpiOrderFormField.CUSTOMER_APPROVAL_ESTIMATED_DATE)?.setValue(null, { emitEvent: false });
    this.minCustomerApprovalDate.set(null);
    this.customerApprovalDateDisabled.set(true);
  }
}
