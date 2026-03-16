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
import { Button } from "primeng/button";
import { Icons } from "../../../../../models/enums/icons";
import { TableColsTitle } from "../../../../../models/enums/table-cols-title";
import { Table, TableModule } from "primeng/table";
import {
  GlobalConfig,
  OtherCostLine,
  OtherCostLineCalculationStrategy,
  OtherCostLineCreate,
  PackagingSize,
} from "../../../../../../client/costSeiko";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DecimalPipe } from "@angular/common";
import { Tooltip } from "primeng/tooltip";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Popover } from "primeng/popover";
import { Chip } from "primeng/chip";
import { CostRequestLineRepo } from "../../../../../repositories/cost-request-line.repo";
import { InputNumber } from "primeng/inputnumber";

interface OtherCostRow {
  uid?: string;
  id: string;
  description: string;
  unitCostInCurrency: number;
  calculationStrategy: OtherCostLineCalculationStrategy;
  packagingSize?: PackagingSize;
  fixedLine: boolean;
  packagingLine: boolean;
  shipmentToCustomerLine: boolean;
  shipmentLocationId?: string;
  shipmentLocationName?: string;
  currencyId?: string;
  currencyCode?: string;
  editableLine: boolean;
  masked: boolean;
  totalCostInSystemCurrency?: number;
  isEditing?: boolean;
  _original?: {
    description: string;
    unitCostInCurrency: number;
    calculationStrategy: OtherCostLineCalculationStrategy;
    packagingSize?: PackagingSize;
    shipmentLocationId?: string;
    shipmentLocationName?: string;
    currencyId?: string;
    currencyCode?: string;
  };
}

@Component({
  selector: "app-other-cost-estimation-tab",
  imports: [
    Button,
    TableModule,
    FormsModule,
    DecimalPipe,
    Tooltip,
    IconField,
    InputIcon,
    InputText,
    Popover,
    Chip,
    InputNumber,
  ],
  templateUrl: "./other-cost-estimation-tab.component.html",
  styleUrl: "./other-cost-estimation-tab.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtherCostEstimationTabComponent {
  otherCostsTable = viewChild<Table>("otherCostsTable");
  validationPopover = viewChild<Popover>("descriptionPopover");
  costRequestUid = input.required<string>();
  lineUid = input.required<string>();
  globalConfig = input.required<GlobalConfig>();

  initialData = input<OtherCostLine[]>([]);
  loading = input<boolean>(false);
  readOnly = input<boolean>(false);
  hasCustomerShipmentLocation = input.required<boolean>();
  totalChange = output<number>();

  otherCosts = signal<OtherCostRow[]>([]);
  sortedOtherCosts = computed<OtherCostRow[]>(() => {
    const regular: OtherCostRow[] = [];
    const shipment: OtherCostRow[] = [];
    for (const o of this.otherCosts()) {
      (o.shipmentToCustomerLine ? shipment : regular).push(o);
    }
    return [...shipment, ...regular];
  });
  hasUnsavedRows = computed(() => this.otherCosts().some((r) => r.isEditing));
  savingRowId = signal<string | null>(null);
  popoverSeverity = signal<"error" | "warn">("error");
  popoverMessage = signal<string>("");

  totalCost = computed(() => {
    let firstShipmentCounted = false;
    return this.otherCosts().reduce((sum, row) => {
      if (row.shipmentToCustomerLine) {
        if (firstShipmentCounted) return sum;
        firstShipmentCounted = true;
      }
      return sum + (row.totalCostInSystemCurrency ?? 0);
    }, 0);
  });

  readonly calculationStrategyOptions: {
    value: OtherCostLineCalculationStrategy;
    symbol: string;
    tooltip: string;
  }[] = [
    {
      value: OtherCostLineCalculationStrategy.MULTIPLIED_BY_QUANTITY,
      symbol: "×",
      tooltip: "Multiplied by quantity",
    },
    {
      value: OtherCostLineCalculationStrategy.DIVIDED_BY_QUANTITY,
      symbol: "÷",
      tooltip: "Divided by quantity",
    },
    {
      value: OtherCostLineCalculationStrategy.AS_IS,
      symbol: "=",
      tooltip: "As Is",
    },
  ];

  readonly packagingSizeOptions: { label: string; value: PackagingSize }[] = [
    { label: "Small", value: PackagingSize.SMALL },
    { label: "Large", value: PackagingSize.LARGE },
  ];

  searchText = "";
  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;
  private destroyRef = inject(DestroyRef);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private initialDataLoaded = false;
  private shipmentLocationOptionsLoaded = false;

  constructor() {
    effect(() => {
      const initial = this.initialData();
      const readOnly = this.readOnly();

      if (readOnly || !this.initialDataLoaded) {
        if (!readOnly && initial && initial.length > 0) {
          this.initialDataLoaded = true;
        }

        if (initial && initial.length > 0) {
          const rows: OtherCostRow[] = initial.map((item) => ({
            uid: item.uid,
            id: item.uid,
            description: item.description,
            unitCostInCurrency: item.unitCostInCurrency,
            calculationStrategy: item.calculationStrategy,
            packagingSize: item.packagingSize,
            fixedLine: item.fixedLine,
            packagingLine: item.packagingLine,
            shipmentToCustomerLine: item.shipmentToCustomerLine,
            shipmentLocationId: item.shipmentLocation?.uid,
            shipmentLocationName: item.shipmentLocation?.name,
            currencyId: item.currency?.uid,
            currencyCode: item.currency?.code,
            editableLine: item.editableLine,
            masked: item.masked,
            totalCostInSystemCurrency: item.totalCostInSystemCurrency,
            isEditing: false,
          }));
          this.otherCosts.set(rows);
        }
      }
    });

    effect(() => {
      const total = this.totalCost();
      this.totalChange.emit(total);
    });

    effect(() => {
      if (
        !this.hasCustomerShipmentLocation() ||
        this.shipmentLocationOptionsLoaded
      )
        return;
      this.shipmentLocationOptionsLoaded = true;
    });
  }

  addRow(): void {
    const newRow: OtherCostRow = {
      id: `other-${Date.now()}`,
      description: "",
      unitCostInCurrency: 0,
      calculationStrategy: OtherCostLineCalculationStrategy.AS_IS,
      fixedLine: false,
      packagingLine: false,
      shipmentToCustomerLine: false,
      editableLine: true,
      masked: false,
      isEditing: true,
    };

    this.otherCosts.update((current) => [...current, newRow]);

    setTimeout(() => {
      const inputElement = document.querySelector(
        `tr[data-row-id="${newRow.id}"] td[data-column="description"] input.p-inputtext`,
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  }

  onCellClick(
    row: OtherCostRow,
    column: "description" | "cost" | "packaging" | "shipment-details",
    event: Event,
  ): void {
    if (column === "description" && row.fixedLine) return;
    event.stopPropagation();
    this.editRow(row);

    setTimeout(() => {
      const rowSelector = `tr[data-row-id="${row.id}"]`;

      if (column === "shipment-details") {
        const selectEl = document.querySelector(
          `${rowSelector} td[data-column="shipment-details"] .shipment-currency-select`,
        ) as HTMLElement;
        selectEl?.click();
        return;
      }

      let inputElement: HTMLInputElement | null = null;
      switch (column) {
        case "description":
          inputElement = document.querySelector(
            `${rowSelector} td[data-column="description"] input.p-inputtext`,
          ) as HTMLInputElement;
          break;
        case "cost":
          inputElement = document.querySelector(
            `${rowSelector} td[data-column="cost"] p-inputNumber input`,
          ) as HTMLInputElement;
          break;
      }

      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 0);
  }

  editRow(row: OtherCostRow): void {
    this.otherCosts.update((current) =>
      current.map((r) =>
        r.id === row.id
          ? {
              ...r,
              isEditing: true,
              _original: {
                description: r.description ?? "",
                unitCostInCurrency: r.unitCostInCurrency ?? 0,
                calculationStrategy: r.calculationStrategy,
                packagingSize: r.packagingSize,
                shipmentLocationId: r.shipmentLocationId,
                shipmentLocationName: r.shipmentLocationName,
                currencyId: r.currencyId,
                currencyCode: r.currencyCode,
              },
            }
          : r,
      ),
    );
  }

  deleteRow(row: OtherCostRow): void {
    if (row.fixedLine) return;

    if (!row.uid) {
      this.otherCosts.update((current) =>
        current.filter((r) => r.id !== row.id),
      );
      return;
    }

    this.savingRowId.set(row.id);
    this.costRequestLineRepo
      .deleteOtherCostLine(this.costRequestUid(), this.lineUid(), row.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          this.syncOtherFromApi(lines);
          this.savingRowId.set(null);
        },
        error: () => {
          this.savingRowId.set(null);
        },
      });
  }

  maskUnmaskRow(row: OtherCostRow): void {
    if (!row.uid) return;
    this.savingRowId.set(row.id);
    this.costRequestLineRepo
      .maskUnmaskOtherCostLine(this.costRequestUid(), this.lineUid(), row.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          this.syncOtherFromApi(lines);
          this.savingRowId.set(null);
        },
        error: () => {
          this.savingRowId.set(null);
        },
      });
  }

  saveRow(row: OtherCostRow): void {
    if (!row.fixedLine) {
      const trimmed = row.description?.trim();
      if (!trimmed) {
        this.showDescriptionPopover(row, "error", "Description is required");
        return;
      }

      const isDuplicate = this.otherCosts().some(
        (r) => r.id !== row.id && r.description?.trim() === trimmed,
      );
      if (isDuplicate && !row.shipmentToCustomerLine) {
        this.showDescriptionPopover(row, "warn", "Description already exists");
        return;
      }
    }
    if (row.unitCostInCurrency === undefined || row.unitCostInCurrency <= 0) {
      this.showUnitCostPopover(
        row,
        "error",
        "Unit price must be greater than 0",
      );
      return;
    }
    this.savingRowId.set(row.id);
    const body: OtherCostLineCreate = {
      description: row.description?.trim() ?? "",
      unitCostInCurrency: row.unitCostInCurrency,
      calculationStrategy: row.calculationStrategy,
      packagingSize: row.packagingSize,
    };

    if (!row.uid) {
      this.costRequestLineRepo
        .createOtherCostLine(this.costRequestUid(), this.lineUid(), body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncOtherFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    } else {
      this.costRequestLineRepo
        .updateOtherCostLine(
          this.costRequestUid(),
          this.lineUid(),
          row.uid,
          body,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncOtherFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    }
  }

  onDescriptionInput(): void {
    this.validationPopover()?.hide();
  }

  onCostInput(): void {
    this.validationPopover()?.hide();
  }

  cancelEdit(row: OtherCostRow): void {
    if (!row.uid) {
      this.otherCosts.update((current) =>
        current.filter((r) => r.id !== row.id),
      );
      return;
    }

    this.otherCosts.update((current) =>
      current.map((r) =>
        r.id === row.id
          ? {
              ...r,
              isEditing: false,
              description: r._original?.description ?? r.description,
              unitCostInCurrency:
                r._original?.unitCostInCurrency ?? r.unitCostInCurrency,
              calculationStrategy:
                r._original?.calculationStrategy ?? r.calculationStrategy,
              packagingSize: r._original?.packagingSize,
              shipmentLocationId:
                r._original?.shipmentLocationId ?? r.shipmentLocationId,
              shipmentLocationName:
                r._original?.shipmentLocationName ?? r.shipmentLocationName,
              currencyId: r._original?.currencyId ?? r.currencyId,
              currencyCode: r._original?.currencyCode ?? r.currencyCode,
            }
          : r,
      ),
    );
  }

  onCostChange(row: OtherCostRow, newValue: number): void {
    row.unitCostInCurrency = newValue;
  }

  getStrategySymbol(strategy: OtherCostLineCalculationStrategy): string {
    return (
      this.calculationStrategyOptions.find((o) => o.value === strategy)
        ?.symbol ?? "="
    );
  }

  getStrategyTooltip(strategy: OtherCostLineCalculationStrategy): string {
    return (
      this.calculationStrategyOptions.find((o) => o.value === strategy)
        ?.tooltip ?? ""
    );
  }

  onPackagingChipClick(row: OtherCostRow, size: PackagingSize): void {
    if (
      this.readOnly() ||
      row.packagingSize === size ||
      this.savingRowId() === row.id
    )
      return;
    this.onPackagingSizeChange(row, size);
    this.saveRow(row);
  }

  onPackagingSizeChange(row: OtherCostRow, size: PackagingSize): void {
    row.packagingSize = size;
    const config = this.globalConfig();
    if (config) {
      row.unitCostInCurrency =
        size === PackagingSize.SMALL
          ? (config.smallPackagingCost ?? 0)
          : (config.largePackagingCost ?? 0);
    }
    this.otherCosts.update((current) => [...current]);
  }

  setStrategy(
    row: OtherCostRow,
    strategy: OtherCostLineCalculationStrategy,
  ): void {
    row.calculationStrategy = strategy;
    this.otherCosts.update((current) => [...current]);
  }

  applyFilterGlobal($event: any) {
    this.otherCostsTable()?.filterGlobal(
      ($event.target as HTMLInputElement).value,
      "contains",
    );
  }

  getCurrencyDisplay(row: OtherCostRow): string {
    const code =
      this.hasCustomerShipmentLocation() && row.shipmentToCustomerLine
        ? row.currencyCode || "MYR"
        : "MYR";
    return this.resolveCurrencySymbol(code);
  }

  private showDescriptionPopover(
    row: OtherCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="description"] input.p-inputtext`,
      severity,
      message,
    );
  }

  private showUnitCostPopover(
    row: OtherCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="cost"] p-inputnumber input`,
      severity,
      message,
    );
  }

  private showShipmentCurrencyPopover(
    row: OtherCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="shipment-details"] .shipment-currency-select`,
      severity,
      message,
    );
  }

  private showShipmentLocationPopover(
    row: OtherCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="shipment-details"] .shipment-location-select`,
      severity,
      message,
    );
  }

  private showPopoverOnSelector(
    selector: string,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.popoverSeverity.set(severity);
    this.popoverMessage.set(message);
    setTimeout(() => {
      const target = document.querySelector(selector) as HTMLElement | null;
      if (target) {
        target.focus?.();
        this.validationPopover()?.show(
          {
            currentTarget: target,
            stopPropagation: () => {},
          },
          target,
        );
      }
    }, 0);
  }

  private syncOtherFromApi(apiLines: OtherCostLine[]): void {
    const editingByUid = new Map(
      this.otherCosts()
        .filter((r) => r.uid && r.isEditing && r.id !== this.savingRowId())
        .map((r) => [r.uid!, r]),
    );

    const currentByUid = new Map(
      this.otherCosts()
        .filter((r) => r.uid)
        .map((r) => [r.uid!, r]),
    );

    const rows: OtherCostRow[] = apiLines.map((item) => {
      const editingRow = editingByUid.get(item.uid);
      if (editingRow) {
        return { ...editingRow, isEditing: true };
      }
      const current = currentByUid.get(item.uid);
      return {
        uid: item.uid,
        id: item.uid,
        description: item.description,
        unitCostInCurrency: item.unitCostInCurrency,
        calculationStrategy: item.calculationStrategy,
        packagingSize: item.packagingSize,
        fixedLine: item.fixedLine,
        packagingLine: item.packagingLine,
        shipmentToCustomerLine: item.shipmentToCustomerLine,
        shipmentLocationId:
          item.shipmentLocation?.uid ?? current?.shipmentLocationId,
        shipmentLocationName:
          item.shipmentLocation?.name ?? current?.shipmentLocationName,
        currencyId: item.currency?.uid ?? current?.currencyId,
        currencyCode: item.currency?.code ?? current?.currencyCode,
        editableLine: item.editableLine,
        masked: item.masked,
        totalCostInSystemCurrency: item.totalCostInSystemCurrency,
        isEditing: false,
      };
    });

    const pendingRows = this.otherCosts().filter(
      (r) => !r.uid && r.isEditing && r.id !== this.savingRowId(),
    );

    this.otherCosts.set([...rows, ...pendingRows]);
  }

  private resolveCurrencySymbol(code: string): string {
    if (code === "MYR") return "RM ";
    try {
      const parts = new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: code,
      }).formatToParts(0);
      const symbol = parts.find((p) => p.type === "currency")?.value ?? code;
      return symbol + " ";
    } catch {
      return code + " ";
    }
  }
}
