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
import { MaterialCategoryFormField } from "../../../models/enums/form-field-names/material-category-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MaterialCategory } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { MaterialCategoryRepo } from "../../../repositories/material-category-repo.service";

@Component({
  selector: "app-material-category-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
  ],
  templateUrl: "./material-category-create-edit-dialog.component.html",
  styleUrl: "./material-category-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialCategoryCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  materialCategoryForm!: FormGroup;
  materialCategoryEdited?: MaterialCategory;
  editMode = signal<boolean>(false);

  protected readonly Icons = Icons;
  protected readonly MaterialCategoryFormField = MaterialCategoryFormField;

  private materialCategoryRepo = inject(MaterialCategoryRepo);

  constructor() {
    super();
  }

  ngOnInit() {
    this.materialCategoryForm = this.formService.buildMaterialCategoryForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.materialCategoryEdited = this.config.data.materialCategory;
        this.updateEditableMaterialCategoryForm();
      } else if (config.prefill) {
        this.materialCategoryForm.patchValue({
          [MaterialCategoryFormField.NAME]: config.prefill.name ?? "",
        });
      }
    }
  }

  updateEditableMaterialCategoryForm() {
    if (this.materialCategoryEdited) {
      this.materialCategoryForm.patchValue({
        [MaterialCategoryFormField.NAME]: this.materialCategoryEdited.name,
        [MaterialCategoryFormField.ABBREVIATION]:
          this.materialCategoryEdited.abbreviation,
      });
    }
  }

  createEditMaterialCategory() {
    if (this.materialCategoryForm.invalid) {
      return;
    }

    const name = this.materialCategoryForm.get(
      MaterialCategoryFormField.NAME,
    )?.value;
    const abbreviation = this.materialCategoryForm.get(
      MaterialCategoryFormField.ABBREVIATION,
    )?.value;

    if (this.editMode()) {
      this.editMaterialCategory(name, abbreviation);
    } else {
      this.createMaterialCategory(name, abbreviation);
    }
  }

  createMaterialCategory(name: string, abbreviation: string) {
    this.materialCategoryRepo
      .createMaterialCategory(name, abbreviation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Material category created");
          this.closeDialog(true);
        },
      });
  }

  editMaterialCategory(name: string, abbreviation: string) {
    this.materialCategoryRepo
      .updateMaterialCategory(
        this.materialCategoryEdited!.uid,
        name,
        abbreviation,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Material category ${this.materialCategoryEdited?.name} updated`,
          );
          this.closeDialog(true);
        },
      });
  }
}
