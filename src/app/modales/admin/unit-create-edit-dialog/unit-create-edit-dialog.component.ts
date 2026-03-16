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
import { UnitFormField } from "../../../models/enums/form-field-names/unit-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UnitRepo } from "../../../repositories/unit.repo";
import { Unit } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";

@Component({
  selector: "app-unit-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
  ],
  templateUrl: "./unit-create-edit-dialog.component.html",
  styleUrl: "./unit-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitCreateEditDialogComponent extends BaseModal implements OnInit {
  unitForm!: FormGroup;
  unitEdited?: Unit;
  editMode = signal<boolean>(false);

  protected readonly Icons = Icons;
  protected readonly UnitFormField = UnitFormField;

  private unitRepo = inject(UnitRepo);

  ngOnInit() {
    this.unitForm = this.formService.buildUnitForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.unitEdited = config.unit;
        this.unitForm.patchValue({
          [UnitFormField.NAME]: this.unitEdited?.name ?? "",
        });
      } else if (config.prefill) {
        this.unitForm.patchValue({
          [UnitFormField.NAME]: config.prefill.name ?? "",
        });
      }
    }
  }

  createEditUnit() {
    if (this.unitForm.invalid) {
      return;
    }

    const name = this.unitForm.get(UnitFormField.NAME)?.value as string;

    if (this.editMode()) {
      this.unitRepo
        .updateUnit(this.unitEdited!.uid, name)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage(
              `Unit "${this.unitEdited?.name}" updated`,
            );
            this.closeDialog(true);
          },
        });
    } else {
      this.unitRepo
        .createUnit(name)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage("Unit created");
            this.closeDialog(true);
          },
        });
    }
  }
}
