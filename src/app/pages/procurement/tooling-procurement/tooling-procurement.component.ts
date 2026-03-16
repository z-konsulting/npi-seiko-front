import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { filter, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { InputNumberModule } from "primeng/inputnumber";
import { Button } from "primeng/button";
import { Tag } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import {
  FileInfo,
  OutsourcingStatus,
  ToolingCostLine,
} from "../../../../client/costSeiko";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { ToolingRepo } from "../../../repositories/tooling.repo";
import { ModalService } from "../../../services/components/modal.service";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { Icons } from "../../../models/enums/icons";
import { OutsourcingStatusPipe } from "../../../pipes/outsourcing-status.pipe";
import { AutoFocusSelectDirective } from "../../../directives/auto-focus-select.directive";
import { OverlayBadge } from "primeng/overlaybadge";
import { environment } from "../../../../environments/environment";

@Component({
  selector: "app-tooling-procurement",
  imports: [
    TableModule,
    Button,
    Tag,
    TooltipModule,
    CardModule,
    PrimeTemplate,
    FormsModule,
    InputNumberModule,
    SearchInputComponent,
    CustomTitleComponent,
    OutsourcingStatusPipe,
    AutoFocusSelectDirective,
    OverlayBadge,
  ],
  templateUrl: "./tooling-procurement.component.html",
  styleUrl: "./tooling-procurement.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolingProcurementComponent extends BaseListComponent {
  toolingRows = signal<ToolingCostLine[]>([]);
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  // so the p-inputNumber is never recreated while the user is typing.
  protected editingValues = new Map<string, number | null>();
  private toolingRepo = inject(ToolingRepo);
  private modalService = inject(ModalService);

  // Plain Map (not a signal): updates do not trigger change detection,
  private handleMessage = inject(HandleToastMessageService);

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.toolingRepo
      .searchToolingsToBeEstimated(
        event.first ?? 0,
        event.rows ?? this.maxRowDefault,
        this.searchText,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.toolingRows.set(result.results);
        this.totalRecords = result.total;
        this.loading = false;
      });
  }

  onRowEditInit(tooling: ToolingCostLine): void {
    this.editingValues.set(tooling.uid, tooling.unitCostInCurrency ?? null);
  }

  onRowEditSave(tooling: ToolingCostLine): void {
    const value = this.editingValues.get(tooling.uid);
    if (value == null || value <= 0) {
      this.handleMessage.errorMessage("Invalid value");
      return;
    }
    this.toolingRepo
      .estimateToolingCostLine(tooling.uid, { unitCostInCurrency: value })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingValues.delete(tooling.uid);
          this.loadData(this.lastTableLazyLoadEvent);
          this.handleMessage.successMessage("Tooling estimated successfully");
        },
      });
  }

  onRowEditCancel(tooling: ToolingCostLine): void {
    this.editingValues.delete(tooling.uid);
  }

  updateEditingValue(uid: string, value: number | null): void {
    this.editingValues.set(uid, value);
  }

  rejectTooling(tooling: ToolingCostLine): void {
    this.modalService
      .showToolingRejectModal()
      .pipe(
        filter((reason): reason is string => !!reason),
        switchMap((reason: string) =>
          this.toolingRepo.rejectToolingCostLine(tooling.uid, {
            rejectReason: reason,
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadData(this.lastTableLazyLoadEvent);
          this.handleMessage.successMessage("Tooling rejected");
        },
      });
  }

  manageMessages(tooling: ToolingCostLine): void {
    this.modalService
      .showToolingMessageModal(tooling.uid, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  manageFiles(tooling: ToolingCostLine): void {
    const url = `${environment.backendUrl}/toolings/to-be-estimated/${tooling.uid}/files`;
    this.toolingRepo
      .getAllToolingCostLineFiles(tooling.uid!)
      .pipe(
        switchMap((files: FileInfo[]) =>
          this.modalService.showManageFileModal(url, files, true),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {});
  }
}
