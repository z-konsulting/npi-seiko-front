import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { InputNumber } from "primeng/inputnumber";
import { BaseModal } from "../../../models/classes/base-modal";
import { Icons } from "../../../models/enums/icons";
import { CostRequest } from "../../../../client/costSeiko";

@Component({
  selector: "app-extend-expiration-dialog",
  imports: [Button, FormsModule, InputNumber, DatePipe],
  templateUrl: "./extend-expiration-dialog.component.html",
  styleUrl: "./extend-expiration-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtendExpirationDialogComponent extends BaseModal implements OnInit {
  costRequest = signal<CostRequest | undefined>(undefined);
  daysToAdd = signal<number>(7);

  newExpirationDate = computed<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(1, this.daysToAdd() || 1));
    return d;
  });

  isValid = computed(() => (this.daysToAdd() ?? 0) >= 1);

  protected readonly Icons = Icons;

  ngOnInit(): void {
    this.costRequest.set(this.config.data.costRequest);
  }

  onDaysChange(value: number | null): void {
    this.daysToAdd.set(value ?? 1);
  }

  confirm(): void {
    if (!this.isValid()) return;
    const date = this.newExpirationDate();
    // Send ISO date string (YYYY-MM-DD)
    const iso = date.toISOString().split("T")[0];
    this.closeDialog(iso);
  }

  cancel(): void {
    this.closeDialog(undefined);
  }
}
