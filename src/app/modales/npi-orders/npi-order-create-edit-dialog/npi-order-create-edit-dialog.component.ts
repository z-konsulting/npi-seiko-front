import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Button } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { DatePickerModule } from "primeng/datepicker";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Customer,
  FileInfo,
  NpiOrder,
  NpiOrderCreate,
  NpiOrderUpdate,
} from "../../../../client/npiSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { NpiOrderRepo } from "../../../repositories/npi-order.repo";
import { NpiOrderFormField } from "../../../models/enums/form-field-names/npi-order-form-field";
import { Icons } from "../../../models/enums/icons";
import { NpiService } from "../../../services/npi.service";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { Select } from "primeng/select";
import { CustomerRepo } from "../../../repositories/customer.repo";
import { OverlayBadge } from "primeng/overlaybadge";
import { environment } from "../../../../environments/environment";
import { ModalService } from "../../../services/components/modal.service";

@Component({
  selector: "app-npi-order-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    InputContainerComponent,
    Select,
    OverlayBadge,
  ],
  templateUrl: "./npi-order-create-edit-dialog.component.html",
  styleUrl: "./npi-order-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpiOrderCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  editMode = signal<boolean>(false);
  npiOrderSelected = signal<NpiOrder | null>(null);
  npiOrderForm = this.formService.buildNpiOrderForm();
  customers = signal<Customer[]>([]);
  filesInfo = signal<FileInfo[]>([]);
  protected readonly Icons = Icons;
  protected readonly NpiOrderFormField = NpiOrderFormField;
  private npiOrderRepo = inject(NpiOrderRepo);
  private customerRepo = inject(CustomerRepo);
  private npiService = inject(NpiService);
  private modalService = inject(ModalService);

  isFinalized = computed(() => {
    if (!this.npiOrderSelected() || !this.editMode()) return false;
    return this.npiService.isFinalOrder(this.npiOrderSelected()?.status!);
  });

  readonly = computed(() => {
    const status = this.npiOrderSelected()?.status;
    if (!status) return false;
    return !this.npiService.isUpdatable(status!);
  });

  ngOnInit(): void {
    if (this.config.data) {
      this.editMode.set(this.config.data.editMode);
      if (this.editMode() && this.config.data.npiOrder) {
        this.npiOrderSelected.set(this.config.data.npiOrder!);
        this.npiOrderForm = this.formService.buildNpiOrderForm(
          this.npiOrderSelected()!,
        );
        if (this.npiOrderSelected()!.status && this.readonly()) {
          this.npiOrderForm.disable();
        }
      }
    }
    this.loadCustomers();
    if (this.editMode()) {
      this.loadFiles();
    }
  }

  manageFiles() {
    let url = `${environment.backendUrl}/temporary-files`;
    if (this.editMode()) {
      url = `${environment.backendUrl}/npi-orders/${this.npiOrderSelected()?.uid}/files`;
    }
    this.modalService
      .showManageFileModal(url, this.filesInfo(), this.readonly(), true, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          this.filesInfo.set(returnedFiles);
        }
      });
  }

  loadFiles() {
    this.npiOrderRepo
      .getAllNpiOrdersFiles(this.npiOrderSelected()?.uid!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          this.filesInfo.set(returnedFiles);
        }
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

  submit(): void {
    if (this.npiOrderForm.invalid) {
      this.npiOrderForm.markAllAsTouched();
      return;
    }
    this.formService.trimFormStringValues(this.npiOrderForm);

    if (this.editMode()) {
      this.updateNpiOrder();
    } else {
      this.createNpiOrder();
    }
  }

  private setSelectedCustomer() {
    if (!this.npiOrderSelected()?.customer) return;
    const defaultCustomer = this.customers().find(
      (customer) => customer.uid === this.npiOrderSelected()?.customer.uid,
    );
    this.npiOrderForm
      .get(NpiOrderFormField.CUSTOMER)
      ?.setValue(defaultCustomer);
  }

  private createNpiOrder(): void {
    const body = this.buildBody();
    if (!body) return;
    if (this.filesInfo() && this.filesInfo().length > 0) {
      body.filesIds = this.filesInfo().map((file) => file.uid);
    }
    this.npiOrderRepo
      .createNpiOrder(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("NPI Order created");
          this.closeDialog(true);
        },
      });
  }

  private updateNpiOrder(): void {
    this.npiOrderRepo
      .updateNpiOrder(this.npiOrderSelected()!.uid, this.buildBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("NPI Order updated");
          this.closeDialog(true);
        },
      });
  }

  private buildBody(): any {
    const form = this.npiOrderForm;
    const orderDateValue: Date | null =
      form.get(NpiOrderFormField.ORDER_DATE)?.value ?? null;
    const targetDeliveryDateValue: Date | null =
      form.get(NpiOrderFormField.TARGET_DELIVERY_DATE)?.value ?? null;
    const customerId: Customer | null =
      form.get(NpiOrderFormField.CUSTOMER)?.value?.uid ?? null;

    return {
      purchaseOrderNumber: form.get(NpiOrderFormField.PURCHASE_ORDER_NUMBER)
        ?.value,
      workOrderId: form.get(NpiOrderFormField.WORK_ORDER_ID)?.value,
      partNumber: form.get(NpiOrderFormField.PART_NUMBER)?.value,
      quantity: form.get(NpiOrderFormField.QUANTITY)?.value,
      orderDate: orderDateValue
        ? RegexPatterns.enDateFormatToString(orderDateValue)
        : new Date().toISOString().split("T")[0],
      targetDeliveryDate: targetDeliveryDateValue
        ? RegexPatterns.enDateFormatToString(targetDeliveryDateValue)
        : new Date().toISOString().split("T")[0],
      customerId: customerId || undefined,
      productName: form.get(NpiOrderFormField.PRODUCT_NAME)?.value || undefined,
    } as NpiOrderCreate | NpiOrderUpdate;
  }

  protected targetDeliveryMinDate(): Date | null {
    return this.npiOrderForm.get(NpiOrderFormField.ORDER_DATE)?.value ?? null;
  }
}
