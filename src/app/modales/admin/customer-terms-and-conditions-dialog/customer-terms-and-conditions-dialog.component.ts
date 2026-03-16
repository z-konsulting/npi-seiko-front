import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { TermsAndConditionsRepo } from "../../../repositories/terms-and-conditions.repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Customer,
  TermsAndConditionsDyson,
  TermsAndConditionsNonDyson,
} from "../../../../client/costSeiko";
import { FormsModule } from "@angular/forms";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { Button } from "primeng/button";
import { Icons } from "../../../models/enums/icons";
import { Popover } from "primeng/popover";
import { finalize } from "rxjs";
import { BaseModal } from "../../../models/classes/base-modal";
import { DecimalPipe } from "@angular/common";

@Component({
  selector: "app-customer-terms-and-conditions-dialog",
  imports: [
    FormsModule,
    InputNumberModule,
    InputTextModule,
    Button,
    Popover,
    DecimalPipe,
  ],
  templateUrl: "./customer-terms-and-conditions-dialog.component.html",
  styleUrl: "./customer-terms-and-conditions-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerTermsAndConditionsDialogComponent
  extends BaseModal
  implements OnInit
{
  customer!: Customer;
  isLoading = signal<boolean>(true);
  isSavingAll = signal<boolean>(false);
  editingField = signal<string | null>(null);

  // Non-Dyson terms
  termsNonDyson = signal<TermsAndConditionsNonDyson | null>(null);
  initialTermsNonDyson: TermsAndConditionsNonDyson | null = null;

  // Dyson terms
  termsDyson = signal<TermsAndConditionsDyson | null>(null);
  initialTermsDyson: TermsAndConditionsDyson | null = null;

  protected readonly Icons = Icons;

  // Field labels mapping
  private fieldLabels: Record<string, string> = {
    // Non-Dyson fields
    validityNumberOfDays: "Validity Number of Days",
    deliveryCharges: "Delivery Charges",
    storageAcceptDeliveryNumberMonths: "Storage Accept Delivery (Months)",
    storageMinimumStorageFee: "Storage Minimum Fee (%)",
    nonCancellationNumberWorkingDays: "Non-Cancellation (Working Days)",
    nonRescheduledNumberWeeks: "Non-Reschedule (Weeks)",
    claimsPackagingDamageNumberDays: "Claims Packaging Damage (Days)",
    forecastLeadTime: "Forecast Lead Time",
    latePaymentPenalty: "Late Payment Penalty (%)",
    // Dyson fields
    validityStartDate: "Validity Start Date",
    validityEndDate: "Validity End Date",
    currencyExchangeRate: "Currency Exchange Rate",
    minimumDeliveryQuantity: "Minimum Delivery Quantity",
  };
  private termsRepo = inject(TermsAndConditionsRepo);

  ngOnInit() {
    this.customer = this.config.data.customer;
    this.loadTerms();
  }

  saveAllNonDyson() {
    const terms = this.termsNonDyson();
    if (!terms || !this.initialTermsNonDyson) return;

    const patch: Partial<TermsAndConditionsNonDyson> = {};
    Object.keys(terms).forEach((key) => {
      const k = key as keyof TermsAndConditionsNonDyson;
      if (terms[k] !== this.initialTermsNonDyson![k]) {
        patch[k] = terms[k] as any;
      }
    });

    if (Object.keys(patch).length === 0) {
      this.handleMessage.successMessage("No changes to save");
      return;
    }

    this.isSavingAll.set(true);

    this.termsRepo
      .patchTermsNonDyson(this.customer.uid, patch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingAll.set(false)),
      )
      .subscribe({
        next: (updatedTerms) => {
          this.termsNonDyson.set(updatedTerms);
          this.initialTermsNonDyson = { ...updatedTerms };
          this.handleMessage.successMessage(
            `${Object.keys(patch).length} field(s) updated successfully`,
          );
        },
      });
  }

  discardAllNonDyson() {
    if (!this.initialTermsNonDyson) return;
    this.termsNonDyson.set({ ...this.initialTermsNonDyson });
    this.handleMessage.infoMessage("All changes discarded");
  }

  saveAllDyson() {
    const terms = this.termsDyson();
    if (!terms || !this.initialTermsDyson) return;

    const patch: Partial<TermsAndConditionsDyson> = {};
    Object.keys(terms).forEach((key) => {
      const k = key as keyof TermsAndConditionsDyson;
      if (terms[k] !== this.initialTermsDyson![k]) {
        patch[k] = terms[k] as any;
      }
    });

    if (Object.keys(patch).length === 0) {
      this.handleMessage.successMessage("No changes to save");
      return;
    }

    this.isSavingAll.set(true);

    this.termsRepo
      .patchTermsDyson(this.customer.uid, patch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingAll.set(false)),
      )
      .subscribe({
        next: (updatedTerms) => {
          this.termsDyson.set(updatedTerms);
          this.initialTermsDyson = { ...updatedTerms };
          this.handleMessage.successMessage(
            `${Object.keys(patch).length} field(s) updated successfully`,
          );
        },
      });
  }

  discardAllDyson() {
    if (!this.initialTermsDyson) return;
    this.termsDyson.set({ ...this.initialTermsDyson });
    this.handleMessage.infoMessage("All changes discarded");
  }

  onFieldFocus(fieldKey: string) {
    this.editingField.set(fieldKey);
  }

  onFieldBlur() {
    this.editingField.set(null);
  }

  scrollToField(fieldKey: string) {
    const element = document.getElementById(`field-${fieldKey}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        element.focus();
      }, 300);
    }
  }

  isFieldModified(fieldKey: string, type: "nonDyson" | "dyson"): boolean {
    if (type === "nonDyson") {
      const terms = this.termsNonDyson();
      if (!terms || !this.initialTermsNonDyson) return false;
      const k = fieldKey as keyof TermsAndConditionsNonDyson;
      return terms[k] !== this.initialTermsNonDyson[k];
    } else {
      const terms = this.termsDyson();
      if (!terms || !this.initialTermsDyson) return false;
      const k = fieldKey as keyof TermsAndConditionsDyson;
      return terms[k] !== this.initialTermsDyson[k];
    }
  }

  getNonDysonChangedFields(): Array<{
    fieldKey: string;
    label: string;
    oldValue: string;
    newValue: string;
  }> {
    const terms = this.termsNonDyson();
    if (!terms || !this.initialTermsNonDyson) return [];

    const changes: Array<{
      fieldKey: string;
      label: string;
      oldValue: string;
      newValue: string;
    }> = [];

    Object.keys(terms).forEach((key) => {
      const k = key as keyof TermsAndConditionsNonDyson;
      if (terms[k] !== this.initialTermsNonDyson![k]) {
        changes.push({
          fieldKey: key,
          label: this.fieldLabels[key] || key,
          oldValue: String(this.initialTermsNonDyson![k] ?? ""),
          newValue: String(terms[k] ?? ""),
        });
      }
    });

    return changes;
  }

  getDysonChangedFields(): Array<{
    fieldKey: string;
    label: string;
    oldValue: string;
    newValue: string;
  }> {
    const terms = this.termsDyson();
    if (!terms || !this.initialTermsDyson) return [];

    const changes: Array<{
      fieldKey: string;
      label: string;
      oldValue: string;
      newValue: string;
    }> = [];

    Object.keys(terms).forEach((key) => {
      const k = key as keyof TermsAndConditionsDyson;
      if (terms[k] !== this.initialTermsDyson![k]) {
        changes.push({
          fieldKey: key,
          label: this.fieldLabels[key] || key,
          oldValue: String(this.initialTermsDyson![k] ?? ""),
          newValue: String(terms[k] ?? ""),
        });
      }
    });

    return changes;
  }

  hasNonDysonChanges(): boolean {
    const terms = this.termsNonDyson();
    if (!terms || !this.initialTermsNonDyson) return false;

    return Object.keys(terms).some((key) => {
      const k = key as keyof TermsAndConditionsNonDyson;
      return terms[k] !== this.initialTermsNonDyson![k];
    });
  }

  hasDysonChanges(): boolean {
    const terms = this.termsDyson();
    if (!terms || !this.initialTermsDyson) return false;

    return Object.keys(terms).some((key) => {
      const k = key as keyof TermsAndConditionsDyson;
      return terms[k] !== this.initialTermsDyson![k];
    });
  }

  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private parseStringToDate(
    dateString: string | null | undefined,
  ): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  private loadTerms() {
    this.isLoading.set(true);

    if (this.customer.dyson) {
      this.termsRepo
        .getTermsDyson(this.customer.uid)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isLoading.set(false)),
        )
        .subscribe({
          next: (terms) => {
            this.termsDyson.set(terms);
            this.initialTermsDyson = { ...terms };
            this.isLoading.set(false);
          },
        });
    } else {
      this.termsRepo
        .getTermsNonDyson(this.customer.uid)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isLoading.set(false)),
        )
        .subscribe({
          next: (terms) => {
            this.termsNonDyson.set(terms);
            this.initialTermsNonDyson = { ...terms };
          },
        });
    }
  }
}
