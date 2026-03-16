import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Button } from "primeng/button";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { Popover } from "primeng/popover";
import { Chip } from "primeng/chip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseModal } from "../../../../../../models/classes/base-modal";
import { Icons } from "../../../../../../models/enums/icons";
import { TableColsTitle } from "../../../../../../models/enums/table-cols-title";
import { MaterialSupplier } from "../../../../../../../client/costSeiko";
import { MaterialRepo } from "../../../../../../repositories/material.repo";

@Component({
  selector: "app-material-supplier-select-dialog",
  imports: [Button, TableModule, TooltipModule, Popover, Chip],
  templateUrl: "./material-supplier-select-dialog.component.html",
  styleUrl: "./material-supplier-select-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialSupplierSelectDialogComponent
  extends BaseModal
  implements OnInit
{
  suppliers = signal<MaterialSupplier[]>([]);
  loading = signal<boolean>(true);
  selectedSupplier = signal<MaterialSupplier | null>(null);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;

  private materialRepo = inject(MaterialRepo);
  private materialUid!: string;
  private currentSupplierUid?: string;

  ngOnInit(): void {
    this.materialUid = this.dataConfig.materialUid;
    this.currentSupplierUid = this.dataConfig.currentSupplierUid;
    this.loadSuppliers();
  }

  select(supplier: MaterialSupplier): void {
    this.selectedSupplier.set(supplier);
  }

  isSelected(supplier: MaterialSupplier): boolean {
    return this.selectedSupplier()?.uid === supplier.uid;
  }

  confirm(): void {
    const selected = this.selectedSupplier();
    if (selected) {
      this.closeDialog(selected.uid);
    }
  }

  private loadSuppliers(): void {
    this.materialRepo
      .retrieveMaterialSuppliersOfMaterial(this.materialUid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((suppliers) => {
        this.suppliers.set(suppliers);
        // Pre-select the current supplier
        const current = suppliers.find(
          (s) => s.uid === this.currentSupplierUid,
        );
        if (current) {
          this.selectedSupplier.set(current);
        }
        this.loading.set(false);
      });
  }
}
