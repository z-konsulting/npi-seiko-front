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
  FileInfo,
  OutsourcingStatus,
  ToolingCostLine,
  ToolingCostLineCreate,
} from "../../../../../../client/costSeiko";
import { FormsModule } from "@angular/forms";
import { InputNumber } from "primeng/inputnumber";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DecimalPipe } from "@angular/common";
import { Tooltip } from "primeng/tooltip";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Popover } from "primeng/popover";
import { Tag } from "primeng/tag";
import { OutsourcingStatusPipe } from "../../../../../pipes/outsourcing-status.pipe";
import { environment } from "../../../../../../environments/environment";
import { switchMap } from "rxjs";
import { ModalService } from "../../../../../services/components/modal.service";
import { OverlayBadge } from "primeng/overlaybadge";
import { CostRequestLineRepo } from "../../../../../repositories/cost-request-line.repo";
import { ConfirmationService } from "primeng/api";

interface ToolingCostRow extends ToolingCostLineCreate {
  uid?: string;
  id: string;
  isEditing?: boolean;
  nbFiles?: number;
  outsourced?: boolean;
  outsourcingStatus?: OutsourcingStatus;
  rejectReason?: string;
  nbMessages: number;
  _original?: {
    description: string;
    quantity: number;
    unitCostInCurrency: number;
    toolingPartNumber?: string;
  };
}

@Component({
  selector: "app-tooling-cost-estimation-tab",
  imports: [
    Button,
    TableModule,
    FormsModule,
    InputNumber,
    DecimalPipe,
    Tooltip,
    IconField,
    InputIcon,
    InputText,
    Popover,
    OverlayBadge,
    Tag,
    OutsourcingStatusPipe,
  ],
  templateUrl: "./tooling-cost-estimation-tab.component.html",
  styleUrl: "./tooling-cost-estimation-tab.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolingCostEstimationTabComponent {
  toolingCostsTable = viewChild<Table>("toolingCostsTable");
  validationPopover = viewChild<Popover>("validationPopover");
  popoverSeverity = signal<"error" | "warn">("error");
  popoverMessage = signal<string>("");
  costRequestUid = input.required<string>();
  lineUid = input.required<string>();
  initialData = input<ToolingCostLine[]>([]);
  loading = input<boolean>(false);
  readOnly = input<boolean>(false);
  totalChange = output<number>();

  toolingCosts = signal<ToolingCostRow[]>([]);
  hasUnsavedRows = computed(() => this.toolingCosts().some((r) => r.isEditing));
  savingRowId = signal<string | null>(null);

  totalCost = computed(() => {
    return this.toolingCosts().reduce((sum, row) => {
      return sum + (row.quantity || 0) * (row.unitCostInCurrency || 0);
    }, 0);
  });
  searchText = "";
  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  protected readonly OutsourcingStatusPipe = OutsourcingStatusPipe;
  private destroyRef = inject(DestroyRef);
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private confirmationService = inject(ConfirmationService);

  private initialDataLoaded = false;

  constructor() {
    effect(() => {
      const initial = this.initialData();
      const readOnly = this.readOnly();

      if (readOnly || !this.initialDataLoaded) {
        if (!readOnly && initial && initial.length > 0) {
          this.initialDataLoaded = true;
        }

        if (initial && initial.length > 0) {
          const rows: ToolingCostRow[] = initial.map((item) => ({
            uid: item.uid,
            id: item.uid,
            description: item.description,
            quantity: item.quantity,
            unitCostInCurrency: item.unitCostInCurrency,
            toolingPartNumber: item.toolingPartNumber,
            nbFiles: item.nbFiles,
            outsourced: item.outsourced,
            outsourcingStatus: item.outsourcingStatus,
            rejectReason: item.rejectReason,
            isEditing: false,
            nbMessages: item?.nbMessages ?? 0,
          }));
          this.toolingCosts.set(rows);
        }
      }
    });

    effect(() => {
      const total = this.totalCost();
      this.totalChange.emit(total);
    });
  }

  addRow(): void {
    const newRow: ToolingCostRow = {
      id: `tooling-${Date.now()}`,
      description: "",
      quantity: 1,
      unitCostInCurrency: 0,
      isEditing: true,
      nbMessages: 0,
    };

    this.toolingCosts.update((current) => [...current, newRow]);

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
    row: ToolingCostRow,
    column: "description" | "toolingPartNumber" | "quantity" | "cost",
    event: Event,
  ): void {
    event.stopPropagation();
    this.editRow(row);

    setTimeout(() => {
      let inputElement: HTMLInputElement | null = null;
      const rowSelector = `tr[data-row-id="${row.id}"]`;

      switch (column) {
        case "description":
          inputElement = document.querySelector(
            `${rowSelector} td[data-column="description"] input.p-inputtext`,
          ) as HTMLInputElement;
          break;
        case "toolingPartNumber":
          inputElement = document.querySelector(
            `${rowSelector} td[data-column="toolingPartNumber"] input.p-inputtext`,
          ) as HTMLInputElement;
          break;
        case "quantity":
          inputElement = document.querySelector(
            `${rowSelector} td[data-column="quantity"] p-inputNumber input`,
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

  editRow(row: ToolingCostRow): void {
    this.toolingCosts.update((current) =>
      current.map((r) =>
        r.id === row.id
          ? {
              ...r,
              isEditing: true,
              _original: {
                description: r.description ?? "",
                quantity: r.quantity ?? 1,
                unitCostInCurrency: r.unitCostInCurrency ?? 0,
                toolingPartNumber: r.toolingPartNumber,
              },
            }
          : r,
      ),
    );
  }

  deleteRow(row: ToolingCostRow): void {
    if (!row.uid) {
      this.toolingCosts.update((current) =>
        current.filter((r) => r.id !== row.id),
      );
      return;
    }

    this.savingRowId.set(row.id);
    this.costRequestLineRepo
      .deleteToolingCostLine(this.costRequestUid(), this.lineUid(), row.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          this.syncToolingFromApi(lines);
          this.savingRowId.set(null);
        },
        error: () => {
          this.savingRowId.set(null);
        },
      });
  }

  saveRow(row: ToolingCostRow): void {
    const trimmed = row.description?.trim();

    if (!trimmed) {
      this.showDescriptionPopover(row, "error", "Description is required");
      return;
    }

    const isDuplicate = this.toolingCosts().some(
      (r) => r.id !== row.id && r.description?.trim() === trimmed,
    );
    if (isDuplicate) {
      this.showDescriptionPopover(row, "warn", "Description already exists");
      return;
    }
    if (row.quantity <= 0) {
      this.showQuantityPopover(row, "error", "Quantity must be greater than 0");
      return;
    }
    if (row.unitCostInCurrency === undefined) {
      return;
    }

    this.savingRowId.set(row.id);
    const body: ToolingCostLineCreate = {
      description: trimmed,
      quantity: row.quantity,
      unitCostInCurrency: row.unitCostInCurrency,
      toolingPartNumber: row.toolingPartNumber?.trim() || undefined,
    };

    if (!row.uid) {
      this.costRequestLineRepo
        .createToolingCostLine(this.costRequestUid(), this.lineUid(), body)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncToolingFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    } else {
      this.costRequestLineRepo
        .updateToolingCostLine(
          this.costRequestUid(),
          this.lineUid(),
          row.uid,
          body,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (lines) => {
            this.syncToolingFromApi(lines);
            this.savingRowId.set(null);
          },
          error: () => {
            this.savingRowId.set(null);
          },
        });
    }
  }

  outsourceRow(row: ToolingCostRow, event: any): void {
    if (!row.uid) return;
    let header = `Outsource tooling line ${row.description}`;
    if (row.toolingPartNumber) {
      header += ` - P/N ${row.toolingPartNumber}`;
    }
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: header,
      header: "Outsource tooling",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      closable: false,
      rejectButtonProps: {
        label: "Cancel",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Outsource",
      },
      accept: () => {
        this.savingRowId.set(row.id);
        this.costRequestLineRepo
          .outsourceToolingCostLine(
            this.costRequestUid(),
            this.lineUid(),
            row.uid!,
          )
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (line) => {
              this.syncToolingFromApi(line);
              this.savingRowId.set(null);
            },
            error: () => {
              this.savingRowId.set(null);
            },
          });
      },
      reject: () => {},
    });
  }

  onDescriptionInput(): void {
    this.validationPopover()?.hide();
  }

  cancelEdit(row: ToolingCostRow): void {
    if (!row.uid) {
      this.toolingCosts.update((current) =>
        current.filter((r) => r.id !== row.id),
      );
      return;
    }

    this.toolingCosts.update((current) =>
      current.map((r) =>
        r.id === row.id
          ? {
              ...r,
              isEditing: false,
              description: r._original?.description ?? r.description,
              quantity: r._original?.quantity ?? r.quantity,
              unitCostInCurrency:
                r._original?.unitCostInCurrency ?? r.unitCostInCurrency,
              toolingPartNumber: r._original?.toolingPartNumber,
            }
          : r,
      ),
    );
  }

  onQuantityChange(row: ToolingCostRow, newValue: number): void {
    row.quantity = newValue;
  }

  onCostChange(row: ToolingCostRow, newValue: number): void {
    row.unitCostInCurrency = newValue;
  }

  calculateLineCost(row: ToolingCostRow): number {
    return (row.quantity || 0) * (row.unitCostInCurrency || 0);
  }

  isOutsourcedEstimated(row: ToolingCostRow): boolean {
    return (
      !!row.outsourced && row.outsourcingStatus === OutsourcingStatus.ESTIMATED
    );
  }

  applyFilterGlobal($event: any) {
    this.toolingCostsTable()?.filterGlobal(
      ($event.target as HTMLInputElement).value,
      "contains",
    );
  }

  manageMessages(row: ToolingCostRow): void {
    if (!row.uid) return;
    const readOnly =
      row.outsourcingStatus !== OutsourcingStatus.TO_BE_ESTIMATED;
    this.modalService
      .showToolingMessageModal(row.uid, readOnly)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  manageFiles(row: ToolingCostRow): void {
    const url = `${environment.backendUrl}/cost-requests/${this.costRequestUid()}/lines/${this.lineUid()}/toolings/${row.uid}/files`;
    this.costRequestLineRepo
      .getAllToolingCostLineFiles(
        this.costRequestUid(),
        this.lineUid(),
        row.uid!,
      )
      .pipe(
        switchMap((files: FileInfo[]) =>
          this.modalService.showManageFileModal(url, files, this.readOnly()),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updatedFiles?: FileInfo[]) => {
        if (updatedFiles !== undefined) {
          this.toolingCosts.update((current) =>
            current.map((r) =>
              r.id === row.id ? { ...r, nbFiles: updatedFiles.length } : r,
            ),
          );
        }
      });
  }

  private showDescriptionPopover(
    row: ToolingCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="description"] input.p-inputtext`,
      severity,
      message,
    );
  }

  private showQuantityPopover(
    row: ToolingCostRow,
    severity: "error" | "warn",
    message: string,
  ): void {
    this.showPopoverOnSelector(
      `tr[data-row-id="${row.id}"] td[data-column="quantity"] p-inputnumber input`,
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

  private syncToolingFromApi(apiLines: ToolingCostLine[]): void {
    // Capture existing rows that are in edit mode (excluding the one being saved)
    const editingByUid = new Map(
      this.toolingCosts()
        .filter((r) => r.uid && r.isEditing && r.id !== this.savingRowId())
        .map((r) => [r.uid!, r]),
    );

    const rows: ToolingCostRow[] = apiLines.map((item) => {
      const editingRow = editingByUid.get(item.uid);
      if (editingRow) {
        return { ...editingRow, isEditing: true };
      }
      return {
        uid: item.uid,
        id: item.uid,
        description: item.description,
        quantity: item.quantity,
        unitCostInCurrency: item.unitCostInCurrency,
        toolingPartNumber: item.toolingPartNumber,
        nbFiles: item.nbFiles,
        outsourced: item.outsourced,
        outsourcingStatus: item.outsourcingStatus,
        isEditing: false,
        nbMessages: item?.nbMessages ?? 0,
      };
    });

    // Preserve locally-added rows still being edited, except the one currently being saved
    const pendingRows = this.toolingCosts().filter(
      (r) => !r.uid && r.isEditing && r.id !== this.savingRowId(),
    );

    this.toolingCosts.set([...rows, ...pendingRows]);
  }
}
