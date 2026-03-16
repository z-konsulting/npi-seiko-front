import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { NgClass } from "@angular/common";
import { FormGroup, FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { BaseModal } from "../../../models/classes/base-modal";
import { Icons } from "../../../models/enums/icons";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import {
  CostRequestLine,
  MaterialCostLine,
  MaterialCostLineCreate,
  MaterialStatus,
  MaterialType,
  UserRole,
} from "../../../../client/costSeiko";
import { CostRequestLineMaterialFormField } from "../../../models/enums/form-field-names/cost-request-form-field";
import { ModalService } from "../../../services/components/modal.service";
import { finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MaterialTypePipe } from "../../../pipes/material-type.pipe";

import { ConfirmationService } from "primeng/api";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { Checkbox } from "primeng/checkbox";
import { AuthenticationService } from "../../../security/authentication.service";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { Chip } from "primeng/chip";

@Component({
  selector: "app-material-lines-manage-dialog",
  imports: [
    Button,
    TableModule,
    TooltipModule,
    ProgressSpinnerModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    MaterialTypePipe,
    NgClass,
    Checkbox,
    FormsModule,
    Chip,
  ],
  templateUrl: "./material-lines-manage-dialog.component.html",
  styleUrl: "./material-lines-manage-dialog.component.scss",
  providers: [MaterialTypePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialLinesManageDialogComponent
  extends BaseModal
  implements OnInit
{
  line!: CostRequestLine;
  costRequestUid!: string;

  materialLines = signal<MaterialCostLine[]>([]);
  directLines = computed(() =>
    this.materialLines().filter(
      (l) => l.materialType !== MaterialType.INDIRECT,
    ),
  );
  indirectLines = computed(() =>
    this.materialLines().filter(
      (l) => l.materialType === MaterialType.INDIRECT,
    ),
  );
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  readOnly = signal<boolean>(false);
  tabIndex = signal<number>(0);
  materialTypeViewSelected = computed<MaterialType>(() =>
    this.tabIndex() === 0 ? MaterialType.DIRECT : MaterialType.INDIRECT,
  );

  userRole = inject(AuthenticationService).getRole() ?? UserRole.ENGINEERING;
  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly MaterialType = MaterialType;
  protected readonly UserRole = UserRole;
  protected readonly MaterialStatus = MaterialStatus;
  private hasChanges = false;
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private modalService = inject(ModalService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.line = this.dataConfig.line;
    this.costRequestUid = this.dataConfig.costRequestUid;
    this.materialLines.set(this.dataConfig.materialLines || []);
    this.readOnly.set(this.dataConfig.readOnly);
    this.loading.set(false);
  }

  onTabChange($event: any) {
    this.tabIndex.set($event);
  }

  openAddDialog(): void {
    const type = this.materialTypeViewSelected();
    this.modalService
      .showMaterialLineFormModal(
        {
          existingEntries: this.buildExistingEntries(null),
          materialType: type,
        },
        false,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((form?: FormGroup | null) => {
        if (form) {
          this.createLine(form, type);
        }
      });
  }

  openEditDialog(line: MaterialCostLine): void {
    const form = this.formService.buildCostRequestLineMaterialForm(line);

    this.modalService
      .showMaterialLineFormModal(
        {
          existingEntries: this.buildExistingEntries(line.uid),
          initialValues: form.getRawValue(),
          materialType: line.materialType ?? MaterialType.DIRECT,
          initialManufacturer: line.manufacturer ?? null,
        },
        true,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedForm?: FormGroup | null) => {
        if (updatedForm) {
          this.updateLine(
            line.uid,
            updatedForm,
            line.materialType ?? MaterialType.DIRECT,
          );
        }
      });
  }

  deleteRow(line: MaterialCostLine, event: Event): void {
    event.stopPropagation();
    const partNumber = line.manufacturerPartNumber ?? "this material";

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to remove ${partNumber}?`,
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: { label: "No", outlined: true },
      accept: () => {
        this.saving.set(true);
        this.costRequestLineRepo
          .deleteMaterialCostLine(this.costRequestUid, this.line.uid, line.uid)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.saving.set(false)),
          )
          .subscribe({
            next: (lines) => {
              this.materialLines.set(lines);
              this.hasChanges = true;
            },
          });
      },
    });
  }

  markNotUse(line: MaterialCostLine): void {
    this.saving.set(true);
    this.costRequestLineRepo
      .markOrUnmarkUsedMaterialCostLineForQuote(
        this.costRequestUid,
        this.line.uid,
        line.uid,
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (lines) => {
          this.materialLines.set(lines);
          this.hasChanges = true;
        },
      });
  }

  close(): void {
    this.closeDialog(this.hasChanges);
  }

  private createLine(form: FormGroup, type: MaterialType): void {
    const body = this.buildBody(form, type);
    this.saving.set(true);
    this.costRequestLineRepo
      .createMaterialCostLine(this.costRequestUid, this.line.uid, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (lines) => {
          this.materialLines.set(lines);
          this.hasChanges = true;
          this.handleMessage.successMessage("Material line added successfully");
        },
      });
  }

  private updateLine(uid: string, form: FormGroup, type: MaterialType): void {
    const body = this.buildBody(form, type);
    this.saving.set(true);
    this.costRequestLineRepo
      .updateMaterialCostLine(this.costRequestUid, this.line.uid, uid, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (lines) => {
          this.materialLines.set(lines);
          this.hasChanges = true;
          this.handleMessage.successMessage(
            "Material line updated successfully",
          );
        },
      });
  }

  private buildBody(
    form: FormGroup,
    type: MaterialType,
  ): MaterialCostLineCreate {
    return {
      manufacturerName:
        form
          .get(CostRequestLineMaterialFormField.MANUFACTURER)
          ?.getRawValue()
          ?.trim() ?? "",
      manufacturerPartNumber:
        form
          .get(CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER)
          ?.getRawValue()
          ?.trim() ?? "",
      description:
        form
          .get(CostRequestLineMaterialFormField.DESCRIPTION)
          ?.getRawValue()
          ?.trim() || undefined,
      categoryName:
        form
          .get(CostRequestLineMaterialFormField.CATEGORY)
          ?.getRawValue()
          ?.trim() || undefined,
      unit:
        form
          .get(CostRequestLineMaterialFormField.UNIT)
          ?.getRawValue()
          ?.trim() || undefined,
      quantity:
        form.get(CostRequestLineMaterialFormField.QUANTITY)?.getRawValue() ?? 1,
      materialType: type,
    };
  }

  private buildExistingEntries(
    excludeUid: string | null,
  ): { manufacturerUid: string; partNumber: string }[] {
    return this.materialLines()
      .filter((l) => l.uid !== excludeUid)
      .filter((l) => !!l.manufacturer?.uid && !!l.manufacturerPartNumber)
      .map((l) => ({
        manufacturerUid: l.manufacturer!.uid,
        partNumber: l.manufacturerPartNumber!.toLowerCase(),
      }));
  }
}
