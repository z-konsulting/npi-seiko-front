import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Button } from "primeng/button";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { Icons } from "../../../models/enums/icons";
import { CostRequest } from "../../../../client/costSeiko";

export type ArchiveActiveCostRequestResult =
  | { decision: "won" }
  | { decision: "lost"; reason: string }
  | { decision: "new-revision-created" };

@Component({
  selector: "app-archive-active-cost-request-dialog",
  imports: [Button, ReactiveFormsModule, InputContainerComponent],
  templateUrl: "./archive-active-cost-request-dialog.component.html",
  styleUrl: "./archive-active-cost-request-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveActiveCostRequestDialogComponent
  extends BaseModal
  implements OnInit
{
  costRequest = signal<CostRequest | undefined>(undefined);
  decision = signal<"won" | "lost" | "new-revision-created" | null>(null);

  reasonControl = new FormControl<string>("", [
    Validators.required,
    Validators.minLength(3),
  ]);

  private reasonValue = toSignal(this.reasonControl.valueChanges, {
    initialValue: "",
  });

  isValid = computed(() => {
    if (this.decision() === "won") return true;
    if (this.decision() === "new-revision-created") return true;
    if (this.decision() === "lost") {
      const val = this.reasonValue();
      return !!val && val.trim().length >= 3;
    }
    return false;
  });

  protected readonly Icons = Icons;

  ngOnInit(): void {
    this.costRequest.set(this.config.data.costRequest);
  }

  selectDecision(decision: "won" | "lost" | "new-revision-created"): void {
    this.decision.set(decision);
    if (decision === "won") {
      this.reasonControl.reset();
    }
  }

  confirm(): void {
    if (!this.isValid()) return;

    const dec = this.decision();
    if (dec === "won") {
      this.closeDialog({ decision: "won" } satisfies ArchiveActiveCostRequestResult);
    } else if (dec === "lost") {
      this.closeDialog({
        decision: "lost",
        reason: this.reasonControl.value!.trim(),
      } satisfies ArchiveActiveCostRequestResult);
    } else if (dec === "new-revision-created") {
      this.closeDialog(
        { decision: "new-revision-created" } satisfies ArchiveActiveCostRequestResult,
      );
    }
  }

  cancel(): void {
    this.closeDialog(undefined);
  }
}
