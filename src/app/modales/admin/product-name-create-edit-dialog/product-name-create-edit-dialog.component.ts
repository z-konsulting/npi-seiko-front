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
import { ProductNameFormField } from "../../../models/enums/form-field-names/product-name-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ProductName } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { ProductNameRepo } from "../../../repositories/product-name.repo";

@Component({
  selector: "app-product-name-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
  ],
  templateUrl: "./product-name-create-edit-dialog.component.html",
  styleUrl: "./product-name-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductNameCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  productNameForm!: FormGroup;
  productNameEdited?: ProductName;
  editMode = signal<boolean>(false);

  protected readonly Icons = Icons;
  protected readonly ProductNameFormField = ProductNameFormField;

  private productNameRepo = inject(ProductNameRepo);

  constructor() {
    super();
  }

  ngOnInit() {
    this.productNameForm = this.formService.buildProductNameForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.productNameEdited = this.config.data.productName;
        this.updateEditableProductNameForm();
      }
    }
  }

  updateEditableProductNameForm() {
    if (this.productNameEdited) {
      this.productNameForm.patchValue({
        [ProductNameFormField.NAME]: this.productNameEdited.name,
        [ProductNameFormField.CODE]: this.productNameEdited.code,
      });
    }
  }

  createEditProductName() {
    if (this.productNameForm.invalid) {
      return;
    }

    const name = this.productNameForm.get(ProductNameFormField.NAME)?.value;
    const code = this.productNameForm.get(ProductNameFormField.CODE)?.value;

    if (this.editMode()) {
      this.editProductName(name, code);
    } else {
      this.createProductName(name, code);
    }
  }

  createProductName(name: string, code: string) {
    this.productNameRepo
      .createProductName(name, code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Product name created");
          this.closeDialog(true);
        },
      });
  }

  editProductName(name: string, code: string) {
    this.productNameRepo
      .updateProductName(this.productNameEdited!.uid, name, code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Product name ${this.productNameEdited?.name} updated`,
          );
          this.closeDialog(true);
        },
      });
  }
}
