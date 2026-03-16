import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { Icons } from "../../../models/enums/icons";
import { ToolingRejectFormField } from "../../../models/enums/form-field-names/tooling-reject-form-field";

@Component({
  selector: "app-tooling-reject-dialog",
  imports: [CardModule, ReactiveFormsModule, Button, InputContainerComponent],
  templateUrl: "./tooling-reject-dialog.component.html",
  styleUrl: "./tooling-reject-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolingRejectDialogComponent extends BaseModal implements OnInit {
  rejectForm!: FormGroup;

  protected readonly Icons = Icons;
  protected readonly ToolingRejectFormField = ToolingRejectFormField;

  ngOnInit(): void {
    this.rejectForm = this.formService.buildToolingRejectForm();
  }

  confirm(): void {
    if (this.rejectForm.invalid) {
      return;
    }
    this.formService.trimFormStringValues(this.rejectForm);
    const reason = this.rejectForm.get(ToolingRejectFormField.REJECT_REASON)
      ?.value as string;
    this.closeDialog(reason);
  }

  cancel(): void {
    this.closeDialog(undefined);
  }
}
