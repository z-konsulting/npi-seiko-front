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
import { InputTextModule } from "primeng/inputtext";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "../../../../client/npiSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { CheckboxModule } from "primeng/checkbox";
import { SelectModule } from "primeng/select";
import { CustomerRepo } from "../../../repositories/customer.repo";
import { CustomerFormField } from "../../../models/enums/form-field-names/customer-form-field";

@Component({
  selector: "app-customer-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    CheckboxModule,
    SelectModule,
  ],
  templateUrl: "./customer-create-edit-dialog.component.html",
  styleUrl: "./customer-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  customerForm!: FormGroup;
  customerEdited?: Customer;
  editMode = signal<boolean>(false);
  protected readonly Icons = Icons;
  protected readonly CustomerFormField = CustomerFormField;
  private customerRepo = inject(CustomerRepo);

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.customerEdited = this.config.data.customer;
      }
    }
    this.customerForm = this.formService.buildCustomerForm(this.customerEdited);
  }

  createEditCustomer() {
    if (this.customerForm.invalid) {
      return;
    }

    if (this.editMode()) {
      this.editCustomer();
    } else {
      this.createCustomer();
    }
  }

  createCustomer() {
    this.customerRepo
      .createCustomer(this.buildBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Customer created");
          this.closeDialog(true);
        },
      });
  }

  editCustomer() {
    this.customerRepo
      .updateCustomer(this.customerEdited!.uid, this.buildBody())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Customer ${this.customerEdited?.name} updated`,
          );
          this.closeDialog(true);
        },
      });
  }

  private buildBody(): CustomerCreate | CustomerUpdate {
    return {
      name: this.customerForm.get(CustomerFormField.NAME)?.value,
      code: this.customerForm.get(CustomerFormField.CODE)?.value,
    } as CustomerCreate | CustomerUpdate;
  }
}
