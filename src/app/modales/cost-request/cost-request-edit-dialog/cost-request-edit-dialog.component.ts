import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { CostRequestFormField } from "../../../models/enums/form-field-names/cost-request-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import {
  CostRequest,
  CostRequestStatus,
  CostRequestUpdate,
  Currency,
  Customer,
  FileInfo,
} from "../../../../client/costSeiko";
import { AccordionModule } from "primeng/accordion";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { Popover } from "primeng/popover";
import { Listbox } from "primeng/listbox";
import { InputGroupModule } from "primeng/inputgroup";
import { InputText } from "primeng/inputtext";
import { AutoComplete } from "primeng/autocomplete";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { OverlayBadge } from "primeng/overlaybadge";
import { ModalService } from "../../../services/components/modal.service";
import { of, switchMap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { CustomerRepo } from "../../../repositories/customer.repo";
import { CostRequestService } from "../../../services/cost-request.service";

@Component({
  selector: "app-cost-request-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    DatePicker,
    Select,
    AccordionModule,
    CommonModule,
    TooltipModule,
    Popover,
    Listbox,
    InputGroupModule,
    InputText,
    AutoComplete,
    NoDoubleClickDirective,
    OverlayBadge,
    IconField,
    InputIcon,
  ],
  templateUrl: "./cost-request-edit-dialog.component.html",
  styleUrl: "./cost-request-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestEditDialogComponent
  extends BaseModal
  implements OnInit
{
  @ViewChild("requestorNamesPopover") requestorNamesPopover!: Popover;
  @ViewChild("customerEmailsPopover") customerEmailsPopover!: Popover;

  costRequestSelected?: CostRequest;
  costRequestForm!: FormGroup;
  currencies = signal<Currency[]>([]);
  customers = signal<Customer[]>([]);
  viewOnly = signal<boolean>(false);
  filesIds = signal<string[]>([]);
  costRequestStatus = signal<CostRequestStatus | undefined>(undefined);
  requestorNameSuggestions = signal<string[]>([]);
  requestorNamesMessage = signal<string>("");
  requestorNamesMessageSeverity = signal<"warn" | "info">("info");
  customerEmailSuggestions = signal<string[]>([]);
  customerEmailsSelected = signal<string[]>([]);
  customerEmailsMessage = signal<string>("");
  customerEmailsMessageSeverity = signal<"warn" | "info">("info");
  protected readonly today = new Date();
  protected readonly Icons = Icons;
  protected readonly CostRequestFormField = CostRequestFormField;
  protected readonly RegexPatterns = RegexPatterns;
  private costRequestRepo = inject(CostRequestRepo);
  private costRequestService = inject(CostRequestService);
  isFinalized = computed(() => {
    const status = this.costRequestStatus();
    if (!status) return false;
    return this.costRequestService.allDataFreezeStatus(status);
  });
  private currencyRepo = inject(CurrencyRepo);
  private customerRepo = inject(CustomerRepo);
  private modalService = inject(ModalService);

  constructor() {
    super();
  }

  ngOnInit() {
    this.costRequestSelected = this.dataConfig.costRequest;
    this.viewOnly.set(this.dataConfig.viewOnly || false);
    this.costRequestStatus.set(this.costRequestSelected?.status);
    this.costRequestForm = this.formService.buildCostRequestForm(
      true,
      this.costRequestSelected,
    );

    // Disable form if viewOnly or finalized
    if (this.viewOnly() || this.isFinalized()) {
      this.costRequestForm.disable();
    }

    this.loadCurrencies();
    this.loadCustomers();
    this.loadFiles();
  }

  loadCurrencies() {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currencies) => {
        this.currencies.set(currencies);
        this.setSelectedCurrency();
      });
  }

  loadCustomers() {
    this.customerRepo
      .listAllCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customers) => {
        this.customers.set(customers);
        this.setSelectedCustomer();
      });
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

  loadFiles() {
    this.costRequestRepo
      .getAllCostRequestFiles(this.costRequestSelected?.uid!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          this.filesIds.set(returnedFiles.map((file) => file.uid));
        }
      });
  }

  manageFiles() {
    const url = `${environment.backendUrl}/cost-requests/${this.costRequestSelected?.uid}/files`;
    this.costRequestRepo
      .getAllCostRequestFiles(this.costRequestSelected?.uid!)
      .pipe(
        switchMap((files: FileInfo[]) => {
          return this.modalService.showManageFileModal(
            url,
            files,
            this.viewOnly(),
            true,
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          this.filesIds.set(returnedFiles.map((file) => file.uid));
        }
      });
  }

  updateCostRequest() {
    if (this.costRequestForm.invalid) {
      this.handleMessage.errorMessage("Please fill all required fields");
      return;
    }
    const customer: Customer = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER,
    )?.value;
    const currency: Currency = this.costRequestForm.get(
      CostRequestFormField.CURRENCY,
    )?.value;
    const customerEmails = this.costRequestForm.get(
      CostRequestFormField.CUSTOMER_EMAILS,
    )?.value;
    const requestorName = this.costRequestForm.get(
      CostRequestFormField.REQUESTOR_NAME,
    )?.value;
    const projectName = this.costRequestForm.get(
      CostRequestFormField.PROJECT_NAME,
    )?.value;
    const purchaseOrderExpectedDate = this.costRequestForm.get(
      CostRequestFormField.PURCHASE_ORDER_EXPECTED_DATE,
    )?.value;
    const dateString =
      RegexPatterns.enDateFormatToString(purchaseOrderExpectedDate) ?? "";

    const payload: CostRequestUpdate = {
      currencyId: currency.uid,
      customerId: customer.uid,
      customerEmails: customerEmails,
      requestorName,
      projectName,
      purchaseOrderExpectedDate: dateString,
    };

    const addName$ =
      requestorName?.trim().length > 0
        ? this.customerRepo.addRequestorName(customer.uid, requestorName)
        : of(undefined);

    addName$
      .pipe(
        switchMap(() =>
          customerEmails.length > 0
            ? this.customerRepo.addCustomerEmails(customer.uid, customerEmails)
            : of(undefined),
        ),
        switchMap(() =>
          this.costRequestRepo.updateCostRequest(
            this.costRequestSelected?.uid!,
            payload,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation updated successfully.",
          );
          this.closeDialog(true);
        },
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

  private setSelectedCustomer() {
    if (!this.costRequestSelected?.customer) return;
    const defaultCustomer = this.customers().find(
      (customer) => customer.uid === this.costRequestSelected?.customer.uid,
    );
    this.costRequestForm
      .get(CostRequestFormField.CUSTOMER)
      ?.setValue(defaultCustomer);
  }

  private setSelectedCurrency() {
    const defaultCustomer = this.currencies().find(
      (currency) => currency.uid === this.costRequestSelected?.currency?.uid,
    );
    this.costRequestForm
      .get(CostRequestFormField.CURRENCY)
      ?.setValue(defaultCustomer);
  }
}
