import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { Button } from "primeng/button";
import { Icons } from "../../../../../models/enums/icons";
import { TableColsTitle } from "../../../../../models/enums/table-cols-title";
import { Table, TableModule } from "primeng/table";
import {
  CostRequestLine,
  CostRequestStatus,
  Process,
  ProcessCostLine,
  ProcessCostLineCreate,
  ProcessCostLineUpdate,
} from "../../../../../../client/costSeiko";
import { ProcessRepo } from "../../../../../repositories/process.repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { InputNumber } from "primeng/inputnumber";
import { DecimalPipe } from "@angular/common";
import { Select } from "primeng/select";
import { Chip } from "primeng/chip";
import { Tooltip } from "primeng/tooltip";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Popover } from "primeng/popover";
import { HandleToastMessageService } from "../../../../../services/handle-toast-message.service";
import { CostRequestLineRepo } from "../../../../../repositories/cost-request-line.repo";

interface ProcessEstimationRow extends ProcessCostLineCreate {
  uid?: string;
  processName: string;
  processCycleTimeInSeconds: number;
  processCurrencyCode: string;
  processCostPerMinute: number;
  processIsSetup: boolean;
  unitCostInSystemCurrency: number;
  totalCostInSystemCurrency: number;
  isEditing?: boolean;
  _originalQuantity?: number;
  _originalCycleTimeInSeconds?: number;
}

@Component({
  selector: "app-process-estimation-tab",
  imports: [
    Button,
    TableModule,
    FormsModule,
    InputNumber,
    DecimalPipe,
    Select,
    Chip,
    Tooltip,
    IconField,
    InputIcon,
    InputText,
    Popover,
  ],
  templateUrl: "./process-estimation-tab.component.html",
  styleUrl: "./process-estimation-tab.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessEstimationTabComponent implements OnInit {
  processTable = viewChild<Table>("processTable");
  validationPopover = viewChild<Popover>("validationPopover");
  popoverSeverity = signal<"error" | "warn">("error");
  popoverMessage = signal<string>("");
  costRequestUid = input.required<string>();
  line = input.required<CostRequestLine>();
  hasCustomerShipmentLocation = input.required<boolean>();
  lineUid = computed(() => this.line()?.uid);
  initialData = input<ProcessCostLine[]>([]);
  loading = input<boolean>(false);
  readOnly = input<boolean>(false);
  totalChange = output<number>();

  processes = signal<ProcessEstimationRow[]>([]);
  sortedProcesses = computed<ProcessEstimationRow[]>(() => {
    const regular: ProcessEstimationRow[] = [];
    const setup: ProcessEstimationRow[] = [];
    for (const p of this.processes()) {
      (p.processIsSetup ? setup : regular).push(p);
    }
    return [...regular, ...setup];
  });
  availableProcesses = signal<Process[]>([]);
  hasUnsavedRows = computed(() => this.processes().some((p) => p.isEditing));
  savingRowId = signal<string | null>(null);

  totalCost = computed(() => {
    return this.processes().reduce((sum, p) => {
      const amount = p.totalCostInSystemCurrency || 0;
      return sum + amount;
    }, 0);
  });

  searchText = "";
  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;
  private processRepo = inject(ProcessRepo);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private destroyRef = inject(DestroyRef);
  private handleMessageService = inject(HandleToastMessageService);
  private initialDataLoaded = false;
  private highestUsageProcesses: Process[] = [];
  private highestUsageLoaded = false;
  private suggestionsAdded = false;

  constructor() {
    // Populate processes when initialData arrives from parent (async)
    effect(() => {
      const initial = this.initialData();
      const readOnly = this.readOnly();

      if (readOnly || !this.initialDataLoaded) {
        if (!readOnly && initial && initial.length > 0) {
          this.initialDataLoaded = true;
        }

        if (initial && initial.length > 0) {
          this.suggestionsAdded = false;
          const rows: ProcessEstimationRow[] = initial.map((p) => ({
            uid: p.uid,
            processId: p.processId,
            processName: p.processName,
            processCurrencyCode: p.processCurrencyCode,
            processCostPerMinute: p.processCostPerMinute,
            processCycleTimeInSeconds: p.processCycleTimeInSeconds,
            processIsSetup: p.processIsSetup,
            quantity: p.quantity,
            unitCostInSystemCurrency: p.unitCostInSystemCurrency,
            totalCostInSystemCurrency: p.totalCostInSystemCurrency,
            isEditing: false,
          }));
          if (this.highestUsageLoaded && !readOnly) {
            const existingIds = new Set(rows.map((r) => r.processId));
            const suggestionRows = this.highestUsageProcesses
              .filter((p) => !existingIds.has(p.uid))
              .map((p) => this.buildSuggestionRow(p));
            this.processes.set([...rows, ...suggestionRows]);
            this.suggestionsAdded = true;
          } else {
            this.processes.set(rows);
          }
        }
      }
    });

    // Watch for total cost changes
    effect(() => {
      const total = this.totalCost();
      this.totalChange.emit(total);
    });
  }

  ngOnInit(): void {
    this.loadProcesses();
    if (this.line().status === CostRequestStatus.READY_TO_ESTIMATE) {
      this.loadHighestUsageProcesses();
    }
  }

  loadProcesses(): void {
    this.processRepo
      .listAllProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (processes) => {
          this.availableProcesses.set(processes);
        },
      });
  }

  loadHighestUsageProcesses(): void {
    this.processRepo
      .getHighestUsageCountProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((processes) => {
        this.highestUsageProcesses = processes;
        this.highestUsageLoaded = true;
        if (!this.suggestionsAdded) {
          this.suggestionsAdded = true;
          const existingIds = new Set(this.processes().map((p) => p.processId));
          const suggestionRows = processes
            .filter((p) => !existingIds.has(p.uid))
            .map((p) => this.buildSuggestionRow(p));
          if (suggestionRows.length > 0) {
            this.processes.update((current) => [...current, ...suggestionRows]);
          }
        }
      });
  }

  onChangedProcess(event: any): void {
    const selected: Process | undefined = event?.value;
    if (!selected) return;

    const exists = this.processes().some((p) => p.processId === selected.uid);
    if (exists) {
      this.handleMessageService.warningMessage(
        `Process ${selected.name} already added.`,
      );
      return;
    }

    const newRow: ProcessEstimationRow = {
      processId: selected.uid,
      processName: selected.name,
      processCycleTimeInSeconds: this.hasCustomerShipmentLocation()
        ? selected.dysonCycleTimeInSeconds
        : selected.nonDysonCycleTimeInSeconds,
      processCurrencyCode: selected.currency.code,
      processCostPerMinute: selected.costPerMinute ?? 0,
      processIsSetup: selected.setupProcess ?? false,
      quantity: 1,
      unitCostInSystemCurrency: 0,
      totalCostInSystemCurrency: 0,
      isEditing: true,
    };
    this.recalculateRow(newRow);

    this.processes.update((current) => [...current, newRow]);
    this.clearFilter();

    setTimeout(() => {
      const inputElement = document.querySelector(
        `tr[data-row-id="${newRow.processId}"] p-inputNumber input`,
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 50);
  }

  onRowClick(row: ProcessEstimationRow): void {
    this.editRow(row);
    setTimeout(() => {
      const input = document.querySelector(
        `tr[data-row-id="${row.processId}"] p-inputNumber input`,
      ) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  editRow(row: ProcessEstimationRow): void {
    this.processes.update((current) =>
      current.map((p) =>
        p.processId === row.processId
          ? {
              ...p,
              isEditing: true,
              _originalQuantity: p.quantity,
              _originalCycleTimeInSeconds: p.processCycleTimeInSeconds,
            }
          : p,
      ),
    );
  }

  deleteRow(row: ProcessEstimationRow): void {
    if (!row.uid) {
      // New row (suggestion or not yet saved): remove locally
      this.processes.update((current) =>
        current.filter((p) => p.processId !== row.processId),
      );
      return;
    }

    this.savingRowId.set(row.processId);
    this.costRequestLineRepo
      .deleteProcessCostLine(this.costRequestUid(), this.lineUid(), row.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          this.syncProcessesFromApi(lines);
          this.savingRowId.set(null);
        },
        error: () => {
          this.savingRowId.set(null);
        },
      });
  }

  saveRow(row: ProcessEstimationRow): void {
    if (row.processCycleTimeInSeconds <= 0) {
      this.showCycleTimePopover(
        row,
        "error",
        "Cycle time must be greater than 0",
      );
      return;
    }
    if (!row.processIsSetup && row.quantity <= 0) {
      this.showQuantityPopover(row, "error", "Quantity must be greater than 0");
      return;
    }

    this.savingRowId.set(row.processId);

    if (!row.uid) {
      // New row: create via API
      const body: ProcessCostLineCreate = {
        processId: row.processId,
        quantity: row.processIsSetup ? 1 : row.quantity,
        processCycleTimeInSeconds: row.processCycleTimeInSeconds,
      };
      this.costRequestLineRepo
        .createProcessCostLine(this.costRequestUid(), this.lineUid(), body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncProcessesFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    } else {
      // Existing row: update via API
      const body: ProcessCostLineUpdate = {
        quantity: row.processIsSetup ? 1 : row.quantity,
        processCycleTimeInSeconds: row.processCycleTimeInSeconds,
      };
      this.costRequestLineRepo
        .updateProcessCostLine(
          this.costRequestUid(),
          this.lineUid(),
          row.uid,
          body,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncProcessesFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    }
  }

  cancelEdit(row: ProcessEstimationRow): void {
    if (!row.uid) {
      // New row not yet saved: remove it
      this.processes.update((current) =>
        current.filter((p) => p.processId !== row.processId),
      );
    } else {
      // Existing row: restore original values
      this.processes.update((current) =>
        current.map((p) =>
          p.processId === row.processId
            ? {
                ...p,
                isEditing: false,
                quantity: p._originalQuantity ?? p.quantity,
                processCycleTimeInSeconds:
                  p._originalCycleTimeInSeconds ?? p.processCycleTimeInSeconds,
              }
            : p,
        ),
      );
    }
  }

  onQuantityChange(row: ProcessEstimationRow, newValue: number): void {
    row.quantity = newValue;
    this.recalculateRow(row);
  }

  onCycleTimeChange(row: ProcessEstimationRow, newValue: number): void {
    row.processCycleTimeInSeconds = newValue;
    this.recalculateRow(row);
  }

  applyFilterGlobal($event: any) {
    this.processTable()?.filterGlobal(
      ($event.target as HTMLInputElement).value,
      "contains",
    );
  }

  private showCycleTimePopover(
    row: ProcessEstimationRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.processId}"] td[data-column="cycle-time"] p-inputnumber input`,
      severity,
      message,
    );
  }

  private showQuantityPopover(
    row: ProcessEstimationRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.processId}"] td[data-column="quantity"] p-inputnumber input`,
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

  private clearFilter(): void {
    this.processTable()?.clearFilterValues();
    this.searchText = "";
  }

  private buildSuggestionRow(p: Process): ProcessEstimationRow {
    const cycleTime = this.hasCustomerShipmentLocation()
      ? p.dysonCycleTimeInSeconds
      : p.nonDysonCycleTimeInSeconds;
    const unitCost = this.calculateUnitCost(cycleTime, p.costPerMinute ?? 0);
    return {
      processId: p.uid,
      processName: p.name,
      processCycleTimeInSeconds: cycleTime,
      processCurrencyCode: p.currency.code,
      processCostPerMinute: p.costPerMinute ?? 0,
      processIsSetup: p.setupProcess ?? false,
      quantity: 0,
      unitCostInSystemCurrency: unitCost,
      totalCostInSystemCurrency: 0,
      isEditing: false,
    };
  }

  private recalculateRow(row: ProcessEstimationRow): void {
    row.unitCostInSystemCurrency = this.calculateUnitCost(
      row.processCycleTimeInSeconds || 0,
      row.processCostPerMinute || 0,
    );
    row.totalCostInSystemCurrency = this.calculateTotalPrice(
      row.processCycleTimeInSeconds || 0,
      row.processCostPerMinute || 0,
      row.quantity ?? 0,
    );
  }

  private calculateUnitCost(
    timeInSeconds: number,
    costPerMinute: number,
  ): number {
    return (timeInSeconds / 60) * costPerMinute;
  }

  private calculateTotalPrice(
    timeInSeconds: number,
    costPerMinute: number,
    quantity: number,
  ): number {
    const unitCost = this.calculateUnitCost(timeInSeconds, costPerMinute);
    return unitCost * quantity;
  }

  private syncProcessesFromApi(apiLines: ProcessCostLine[]): void {
    const apiProcessIds = new Set(apiLines.map((l) => l.processId));

    // Capture existing rows that are in edit mode (excluding the one being saved)
    const editingByProcessId = new Map(
      this.processes()
        .filter(
          (p) => p.uid && p.isEditing && p.processId !== this.savingRowId(),
        )
        .map((p) => [p.processId, p]),
    );

    const apiRows: ProcessEstimationRow[] = apiLines.map((l) => {
      const editingRow = editingByProcessId.get(l.processId);
      if (editingRow) {
        // Restore the local editing state for this row
        return { ...editingRow, uid: l.uid, isEditing: true };
      }
      return {
        uid: l.uid,
        processId: l.processId,
        processName: l.processName,
        processCurrencyCode: l.processCurrencyCode,
        processCostPerMinute: l.processCostPerMinute,
        processCycleTimeInSeconds: l.processCycleTimeInSeconds,
        processIsSetup: l.processIsSetup,
        quantity: l.quantity,
        unitCostInSystemCurrency: l.unitCostInSystemCurrency,
        totalCostInSystemCurrency: l.totalCostInSystemCurrency,
        isEditing: false,
      };
    });

    // Preserve locally-added rows still being edited (not yet saved to API)
    const pendingRows = this.processes().filter(
      (p) => !p.uid && p.isEditing && !apiProcessIds.has(p.processId),
    );

    const pendingIds = new Set(pendingRows.map((r) => r.processId));
    const suggestionRows = this.highestUsageProcesses
      .filter((p) => !apiProcessIds.has(p.uid) && !pendingIds.has(p.uid))
      .map((p) => this.buildSuggestionRow(p));

    this.processes.set([...apiRows, ...pendingRows, ...suggestionRows]);
  }
}
