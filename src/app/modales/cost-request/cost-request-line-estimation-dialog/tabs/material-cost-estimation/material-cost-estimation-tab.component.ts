import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { Icons } from "../../../../../models/enums/icons";
import { TableColsTitle } from "../../../../../models/enums/table-cols-title";
import { Table, TableModule } from "primeng/table";
import {
  ChosenSupplierAndMoq,
  MaterialCostLine,
  MaterialStatus,
  MaterialSubstituteCostLine,
  MaterialType,
} from "../../../../../../client/costSeiko";
import { FormsModule } from "@angular/forms";
import { DecimalPipe } from "@angular/common";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { MaterialTypePipe } from "../../../../../pipes/material-type.pipe";
import { Popover } from "primeng/popover";
import { Chip } from "primeng/chip";
import { Button } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { CostRequestLineRepo } from "../../../../../repositories/cost-request-line.repo";
import { ModalService } from "../../../../../services/components/modal.service";
import { ConfirmationService } from "primeng/api";
import { TruncateCellComponent } from "../../../../../components/truncate-cell/truncate-cell.component";

interface MoqPopoverData {
  chosenSupplierAndMoq: ChosenSupplierAndMoq;
  canChangeSupplier: boolean;
  isSubstitute: boolean;
  row?: MaterialEstimationRow;
}

interface MaterialEstimationRow {
  uid: string;
  materialUid: string;
  manufacturerId?: string;
  manufacturerPartNumber: string;
  description?: string;
  categoryId?: string;
  materialType: string;
  quantity: number;
  materialName?: string;
  manufacturerName?: string;
  categoryName?: string;
  unitName?: string;
  unitPurchasingPriceInSystemCurrency?: number;
  totalPurchasingPriceInSystemCurrency?: number;
  status?: MaterialStatus;
  chosenSupplierAndMoq?: ChosenSupplierAndMoq;
  hasMaterialSubstitute?: boolean;
  materialSubstitute?: MaterialSubstituteCostLine;
  markedNotUsedForQuote?: boolean;
}

@Component({
  selector: "app-material-cost-estimation-tab",
  imports: [
    TableModule,
    FormsModule,
    DecimalPipe,
    IconField,
    InputIcon,
    InputText,
    TooltipModule,
    MaterialTypePipe,
    Popover,
    Chip,
    Button,
    TruncateCellComponent,
  ],
  templateUrl: "./material-cost-estimation-tab.component.html",
  styleUrl: "./material-cost-estimation-tab.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialCostEstimationTabComponent {
  materialTable = viewChild<Table>("materialTable");
  moqPopover = viewChild<Popover>("moqPopover");
  initialData = input<MaterialCostLine[]>([]);
  loading = input<boolean>(false);
  readOnly = input<boolean>(false);
  costRequestUid = input<string>("");
  lineUid = input<string>("");
  isEngineering = input<boolean>(false);
  totalChange = output<number>();

  materials = signal<MaterialEstimationRow[]>([]);
  totalCost = computed(() => {
    return this.materials().reduce((sum, m) => {
      if (m.markedNotUsedForQuote) return sum;
      const amount = m.hasMaterialSubstitute
        ? m.materialSubstitute?.totalPurchasingPriceInSystemCurrency || 0
        : m.totalPurchasingPriceInSystemCurrency || 0;
      return sum + amount;
    }, 0);
  });
  activeFilter = signal<string | null>(null);
  filteredMaterials = computed(() => {
    const filter = this.activeFilter();
    const all = this.materials();
    const filtered = filter
      ? all.filter((m) => m.materialType === filter)
      : [...all];
    return filtered.sort((a, b) => {
      const aNotUsed = a.markedNotUsedForQuote ? 1 : 0;
      const bNotUsed = b.markedNotUsedForQuote ? 1 : 0;
      return aNotUsed - bNotUsed;
    });
  });
  directCount = computed(
    () =>
      this.materials().filter((m) => m.materialType === MaterialType.DIRECT)
        .length,
  );
  indirectCount = computed(
    () =>
      this.materials().filter((m) => m.materialType === MaterialType.INDIRECT)
        .length,
  );
  searchText = "";
  savingSubstitute = signal<boolean>(false);
  savingSupplier = signal<string | null>(null);
  activeMoqData = signal<MoqPopoverData | null>(null);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;

  private destroyRef = inject(DestroyRef);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private confirmationService = inject(ConfirmationService);

  constructor() {
    effect(() => {
      const initial = this.initialData();

      if (initial && initial.length > 0) {
        const rows: MaterialEstimationRow[] = initial.map((m) =>
          this.mapToRow(m),
        );
        this.materials.set(rows);
      } else {
        this.materials.set([]);
      }
    });

    effect(() => {
      const total = this.totalCost();
      this.totalChange.emit(total);
    });
  }

  showMoqPopover(
    event: Event,
    chosenSupplierAndMoq: ChosenSupplierAndMoq,
    canChangeSupplier: boolean,
    row?: MaterialEstimationRow,
    isSubstitute = false,
  ): void {
    this.activeMoqData.set({
      chosenSupplierAndMoq,
      canChangeSupplier,
      isSubstitute,
      row,
    });
    this.moqPopover()?.toggle(event);
  }

  hideMoqPopover(): void {
    this.moqPopover()?.hide();
  }

  toggleFilter(type: string): void {
    this.activeFilter.update((current) => (current === type ? null : type));
  }

  getMaterialDisplayName(row: MaterialEstimationRow): string {
    return (
      row.materialName ||
      `${row.manufacturerName} - ${row.manufacturerPartNumber}`
    );
  }

  getSubstituteDisplayName(substitute: MaterialSubstituteCostLine): string {
    return `${substitute.manufacturer.name} - ${substitute.manufacturerPartNumber}`;
  }

  applyFilterGlobal($event: Event): void {
    this.materialTable()?.filterGlobal(
      ($event.target as HTMLInputElement).value,
      "contains",
    );
  }

  openAddSubstituteDialog(row: MaterialEstimationRow): void {
    this.modalService
      .showMaterialSubstituteSelectModal(
        row.materialName ?? row.manufacturerPartNumber,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (result?: { materialSubstituteId: string; quantity: number }) => {
          if (!result) return;
          this.savingSubstitute.set(true);
          this.costRequestLineRepo
            .createMaterialSubstitute(
              this.costRequestUid(),
              this.lineUid(),
              row.uid,
              {
                materialSubstituteId: result.materialSubstituteId,
                quantity: result.quantity,
              },
            )
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => this.savingSubstitute.set(false)),
            )
            .subscribe({
              next: (updatedLine) => {
                this.updateRowInList(updatedLine);
              },
            });
        },
      );
  }

  removeSubstitute(row: MaterialEstimationRow, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to remove the substitute for "${row.manufacturerPartNumber}"?`,
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: { label: "No", outlined: true },
      accept: () => {
        this.savingSubstitute.set(true);
        this.costRequestLineRepo
          .deleteMaterialSubstitute(
            this.costRequestUid(),
            this.lineUid(),
            row.uid,
          )
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.savingSubstitute.set(false)),
          )
          .subscribe({
            next: (updatedLine) => {
              this.updateRowInList(updatedLine);
            },
          });
      },
    });
  }

  openChangeSubstituteSupplierDialog(row: MaterialEstimationRow): void {
    const substitute = row.materialSubstitute;
    if (!substitute) return;
    const displayName = `${substitute.manufacturer.name} - ${substitute.manufacturerPartNumber}`;
    const currentSupplierUid =
      substitute.chosenSupplierAndMoq?.chosenSupplier?.uid;

    this.modalService
      .showMaterialSupplierSelectModal(
        substitute.uid,
        displayName,
        currentSupplierUid,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((materialSupplierId) => {
        if (!materialSupplierId) return;
        this.savingSupplier.set(row.uid);
        this.costRequestLineRepo
          .updateSupplierForSubstituteOfMaterialCostLine(
            this.costRequestUid(),
            this.lineUid(),
            row.uid,
            { materialSupplierId },
          )
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.savingSupplier.set(null)),
          )
          .subscribe({
            next: (updatedLines) => {
              const updatedLine = updatedLines.find(
                (l) => l.materialCostLineId === row.uid,
              );
              if (updatedLine) {
                this.updateRowInList(updatedLine);
              }
            },
          });
      });
  }

  openChangeSupplierDialog(row: MaterialEstimationRow): void {
    const currentSupplierUid = row.chosenSupplierAndMoq?.chosenSupplier?.uid;
    this.modalService
      .showMaterialSupplierSelectModal(
        row.materialUid,
        row.materialName ?? row.manufacturerPartNumber,
        currentSupplierUid,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((materialSupplierId) => {
        if (!materialSupplierId) return;
        this.savingSupplier.set(row.uid);
        this.costRequestLineRepo
          .updateSupplierForMaterialCostLine(
            this.costRequestUid(),
            this.lineUid(),
            row.uid,
            { materialSupplierId },
          )
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.savingSupplier.set(null)),
          )
          .subscribe({
            next: (updatedLines) => {
              const updatedLine = updatedLines.find(
                (l) => l.materialCostLineId === row.uid,
              );
              if (updatedLine) {
                this.updateRowInList(updatedLine);
              }
            },
          });
      });
  }

  private updateRowInList(updatedLine: MaterialCostLine): void {
    this.materials.update((rows) =>
      rows.map((r) =>
        r.uid === updatedLine.materialCostLineId
          ? this.mapToRow(updatedLine)
          : r,
      ),
    );
  }

  private mapToRow(m: MaterialCostLine): MaterialEstimationRow {
    return {
      uid: m.materialCostLineId ?? "",
      materialUid: m.uid,
      manufacturerId: m.manufacturer?.uid,
      manufacturerPartNumber: m.manufacturerPartNumber,
      description: m.description,
      categoryId: m?.category?.uid,
      unitName: m?.unit ?? m.draftUnitName,
      materialType: m.materialType,
      quantity: m.quantity,
      materialName: `${m.manufacturer?.name ?? m.draftManufacturerName} - ${m.manufacturerPartNumber}`,
      manufacturerName: m.manufacturer?.name ?? m.draftManufacturerName,
      categoryName: m?.category?.name ?? m.draftCategoryName,
      unitPurchasingPriceInSystemCurrency:
        m.unitPurchasingPriceInSystemCurrency,
      totalPurchasingPriceInSystemCurrency:
        m.totalPurchasingPriceInSystemCurrency,
      status: m.status,
      chosenSupplierAndMoq: m.chosenSupplierAndMoq,
      hasMaterialSubstitute: m.hasMaterialSubstitute,
      materialSubstitute: m.materialSubstitute,
      markedNotUsedForQuote: m.markedNotUsedForQuote,
    };
  }
}
