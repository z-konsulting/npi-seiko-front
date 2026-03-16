import { Component, inject, OnInit, signal, ViewChild } from "@angular/core";
import { Button } from "primeng/button";
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Select } from "primeng/select";
import { Icons } from "../../../models/enums/icons";
import { DatePicker } from "primeng/datepicker";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { BaseModal } from "../../../models/classes/base-modal";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { of, switchMap } from "rxjs";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import {
  CostRequestFormField,
  CostRequestLineFormField,
} from "../../../models/enums/form-field-names/cost-request-form-field";
import {
  CostRequestCreate,
  CostRequestLineCreate,
  Currency,
  Customer,
  FileInfo,
  ProductName,
} from "../../../../client/costSeiko";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { OverlayBadge } from "primeng/overlaybadge";
import { ModalService } from "../../../services/components/modal.service";
import { AutoComplete } from "primeng/autocomplete";
import { Popover } from "primeng/popover";
import { Listbox } from "primeng/listbox";
import { InputGroupModule } from "primeng/inputgroup";
import { InputText } from "primeng/inputtext";
import { environment } from "../../../../environments/environment";
import { MaterialTypePipe } from "../../../pipes/material-type.pipe";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Tooltip } from "primeng/tooltip";
import { CustomerRepo } from "../../../repositories/customer.repo";
import { ProductNameRepo } from "../../../repositories/product-name.repo";
import { CostRequestCreateLineRequestedComponent } from "./cost-request-create-line-requested/cost-request-create-line-requested.component";

@Component({
  selector: "app-cost-request-create-dialog",
  imports: [
    Button,
    FormsModule,
    Select,
    ReactiveFormsModule,
    DatePicker,
    InputContainerComponent,
    NoDoubleClickDirective,
    AutoComplete,
    Popover,
    Listbox,
    InputGroupModule,
    InputText,
    OverlayBadge,
    IconField,
    InputIcon,
    Tooltip,
    CostRequestCreateLineRequestedComponent,
  ],
  templateUrl: "./cost-request-create-dialog.component.html",
  styleUrl: "./cost-request-create-dialog.component.scss",
  providers: [MaterialTypePipe],
})
export class CostRequestCreateDialogComponent
  extends BaseModal
  implements OnInit
{
  @ViewChild("requestorNamesPopover") requestorNamesPopover!: Popover;
  @ViewChild("customerEmailsPopover") customerEmailsPopover!: Popover;

  costRequestForm!: FormGroup;
  currencies = signal<Currency[]>([]);
  customers = signal<Customer[]>([]);
  productNames = signal<ProductName[]>([]);
  filesInfo = signal<FileInfo[]>([]);
  requestorNameSuggestions = signal<string[]>([]);
  requestorNamesMessage = signal<string>("");
  requestorNamesMessageSeverity = signal<"warn" | "info">("info");
  customerEmailSuggestions = signal<string[]>([]);
  customerEmailsSelected = signal<string[]>([]);
  customerEmailsMessage = signal<string>("");
  customerEmailsMessageSeverity = signal<"warn" | "info">("info");
  protected readonly Icons = Icons;
  protected readonly CostRequestFormField = CostRequestFormField;
  protected readonly RegexPatterns = RegexPatterns;
  protected readonly today = new Date();

  private costRequestRepo = inject(CostRequestRepo);
  private currencyRepo = inject(CurrencyRepo);
  private productNameRepo = inject(ProductNameRepo);
  private customerRepo = inject(CustomerRepo);
  private modalService = inject(ModalService);

  get linesFormArray(): FormArray {
    return this.costRequestForm.get(CostRequestFormField.LINES) as FormArray;
  }

  ngOnInit() {
    this.costRequestForm = this.formService.buildCostRequestForm(false);
    this.loadCurrencies();
    this.loadCustomers();
    this.loadProductNames();
  }

  loadCurrencies() {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currencies) => {
        this.currencies.set(currencies);
        this.costRequestForm
          .get(CostRequestFormField.CURRENCY)
          ?.setValue(currencies[0]);
      });
  }

  loadCustomers() {
    this.customerRepo
      .listAllCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customers) => {
        this.customers.set(customers);
      });
  }

  loadProductNames() {
    this.productNameRepo
      .listAllProductNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((productNames) => {
        this.productNames.set(productNames);
      });
  }

  manageFiles() {
    const urlFiles = `${environment.backendUrl}/temporary-files`;
    this.modalService
      .showManageFileModal(urlFiles, this.filesInfo(), false, true, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          this.filesInfo.set(returnedFiles);
        }
      });
  }

  showRequestorNames(event: Event) {
    const customer: Customer | undefined = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER,
    )?.value;
    if (!customer?.uid) {
      this.requestorNameSuggestions.set([]);
      this.requestorNamesMessage.set("Please select a customer first");
      this.requestorNamesMessageSeverity.set("warn");
      this.requestorNamesPopover.toggle(event);
      return;
    }
    this.customerRepo
      .getRequestorNames(customer.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((names) => {
        if (!names || names.length === 0) {
          this.requestorNameSuggestions.set([]);
          this.requestorNamesMessage.set(
            "No requestor names found for this customer",
          );
          this.requestorNamesMessageSeverity.set("info");
        } else {
          this.requestorNamesMessage.set("");
          this.requestorNameSuggestions.set(names);
        }
        this.requestorNamesPopover.toggle(event);
      });
  }

  selectRequestorName(name: string) {
    this.costRequestForm
      .get(CostRequestFormField.REQUESTOR_NAME)
      ?.setValue(name);
    this.requestorNamesPopover.hide();
  }

  showCustomerEmails(event: Event) {
    const customer: Customer | undefined = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER,
    )?.value;
    if (!customer?.uid) {
      this.customerEmailSuggestions.set([]);
      this.customerEmailsMessage.set("Please select a customer first");
      this.customerEmailsMessageSeverity.set("warn");
      this.customerEmailsPopover.toggle(event);
      return;
    }
    this.customerRepo
      .getCustomerEmails(customer.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((emails) => {
        if (!emails || emails.length === 0) {
          this.customerEmailSuggestions.set([]);
          this.customerEmailsMessage.set("No emails found for this customer");
          this.customerEmailsMessageSeverity.set("info");
        } else {
          this.customerEmailsMessage.set("");
          this.customerEmailSuggestions.set(emails);
          const currentEmails: string[] =
            this.costRequestForm.get(CostRequestFormField.CUSTOMER_EMAILS)
              ?.value ?? [];
          const suggestionsSet = new Set(emails);
          this.customerEmailsSelected.set(
            currentEmails.filter((e) => suggestionsSet.has(e)),
          );
        }
        this.customerEmailsPopover.toggle(event);
      });
  }

  onCustomerEmailsChange(selectedEmails: string[]) {
    const control = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER_EMAILS,
    );
    if (!control) return;
    const currentEmails: string[] = control.value ?? [];
    const suggestions = new Set(this.customerEmailSuggestions());
    const manualEmails = currentEmails.filter((e) => !suggestions.has(e));
    control.setValue([...manualEmails, ...selectedEmails]);
  }

  addEmail(event: any): void {
    const emailAdded: string = (event.value ?? "").trim();
    const control = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER_EMAILS,
    );

    if (!control) return;

    const emails: string[] = [...(control.value ?? [])];
    const lastIndex = emails.lastIndexOf(emailAdded);
    const regex = new RegExp(RegexPatterns.EMAIL);
    const isValid = regex.test(emailAdded);
    if (!isValid) {
      if (lastIndex !== -1) {
        emails.splice(lastIndex, 1);
        control.setValue(emails);
      }
      this.handleMessage.warningMessage("Invalid email address");
      return;
    }
  }

  onSubmit() {
    this.formService.trimFormStringValues(this.costRequestForm);
    if (this.hasDuplicatePartNumberAndRevision()) {
      this.handleMessage.warningMessage(
        "Duplicate part number and revision found.",
      );
      return;
    }
    const customer: Customer = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER,
    )?.value;
    const currency: Currency = this.costRequestForm.get(
      CostRequestFormField.CURRENCY,
    )?.value;
    const lines: CostRequestLineCreate[] = this.getLinesBody();
    const body: CostRequestCreate = {
      customerId: customer.uid,
      customerEmails: this.costRequestForm.get(
        CostRequestFormField.CUSTOMER_EMAILS,
      )?.value,
      requestorName: this.costRequestForm.get(
        CostRequestFormField.REQUESTOR_NAME,
      )?.value,
      projectName: this.costRequestForm.get(CostRequestFormField.PROJECT_NAME)
        ?.value,
      purchaseOrderExpectedDate:
        RegexPatterns.enDateFormatToString(
          this.costRequestForm.get(
            CostRequestFormField.PURCHASE_ORDER_EXPECTED_DATE,
          )?.value,
        ) ?? "",
      currencyId: currency.uid ?? "",
      filesIds: (this.filesInfo() ?? []).map((f) => f.uid),
      lines: lines,
    };
    this.saveContactsThenCreateCostRequest(customer.uid, body);
  }

  private saveContactsThenCreateCostRequest(
    customerUid: string,
    body: CostRequestCreate,
  ) {
    const requestorName: string = body.requestorName ?? "";
    const customerEmails: string[] = body.customerEmails ?? [];

    const addName$ =
      requestorName.trim().length > 0
        ? this.customerRepo.addRequestorName(customerUid, requestorName)
        : of(undefined);

    addName$
      .pipe(
        switchMap(() =>
          customerEmails.length > 0
            ? this.customerRepo.addCustomerEmails(customerUid, customerEmails)
            : of(undefined),
        ),
        switchMap(() => this.costRequestRepo.createCostRequest(body)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation created successfully.",
          );
          this.closeDialog(true);
        },
      });
  }

  private getLinesBody() {
    return this.linesFormArray.controls
      .filter((lineControl) => {
        const lineForm = lineControl as FormGroup;
        return lineForm.valid;
      })
      .map((control) => {
        const lineForm = control as FormGroup;
        const finalValues = lineForm.get(CostRequestLineFormField.QUANTITIES)
          ?.value
          ? lineForm
              .get(CostRequestLineFormField.QUANTITIES)
              ?.value.map((v: any) => Number(v))
          : [];
        const productName: ProductName | undefined = lineForm.get(
          CostRequestLineFormField.PRODUCT_NAME,
        )?.value;
        const filesIds: FileInfo[] =
          lineForm.get(CostRequestLineFormField.FILES)?.value ?? [];

        return {
          customerPartNumber: lineForm.get(
            CostRequestLineFormField.CUSTOMER_PART_NUMBER,
          )?.value,
          customerPartNumberRevision: lineForm.get(
            CostRequestLineFormField.CUSTOMER_PART_NUMBER_REVISION,
          )?.value,
          description: lineForm.get(CostRequestLineFormField.DESCRIPTION)
            ?.value,
          costingMethodType: lineForm.get(
            CostRequestLineFormField.CR_METHOD_TYPE,
          )?.value,
          productNameId: productName?.uid,
          quantities: finalValues,
          filesIds:
            filesIds.length > 0 ? filesIds.map((f) => f.uid) : undefined,
        } satisfies CostRequestLineCreate;
      });
  }

  private hasDuplicatePartNumberAndRevision(): boolean {
    const seen = new Set<string>();

    for (const formGroup of this.linesFormArray.controls) {
      const partNumber = formGroup.get(
        CostRequestLineFormField.CUSTOMER_PART_NUMBER,
      )?.value;
      const revision = formGroup.get(
        CostRequestLineFormField.CUSTOMER_PART_NUMBER_REVISION,
      )?.value;

      if (!partNumber || !revision) continue;

      const key = `${partNumber}::${revision}`;

      if (seen.has(key)) {
        return true;
      }

      seen.add(key);
    }

    return false;
  }
}
