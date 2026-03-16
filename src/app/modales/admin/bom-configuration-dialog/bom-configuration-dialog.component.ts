import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { BomConfigFormField } from "../../../models/enums/form-field-names/bom-configuration-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BomConfigurationRepo } from "../../../repositories/bom-configuration.repo";
import {
  BomConfiguration,
  BomConfigurationCreate,
  BomConfigurationUpdate,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { BomMappingFormComponent } from "../../../components/bom-mapping-form/bom-mapping-form.component";

@Component({
  selector: "app-bom-configuration-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    BomMappingFormComponent,
  ],
  templateUrl: "./bom-configuration-dialog.component.html",
  styleUrl: "./bom-configuration-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BomConfigurationDialogComponent
  extends BaseModal
  implements OnInit
{
  form!: FormGroup;
  editMode = signal<boolean>(false);
  configEdited?: BomConfiguration;

  protected readonly Icons = Icons;
  protected readonly BomConfigFormField = BomConfigFormField;

  private bomConfigRepo = inject(BomConfigurationRepo);

  ngOnInit() {
    this.form = this.formService.buildBomConfigurationForm();

    if (this.config.data) {
      const data = this.config.data;
      this.editMode.set(data.editMode);
      if (this.editMode() && data.config) {
        this.configEdited = data.config;
        this.patchForm(data.config);
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const v = this.form.value;

    const body: BomConfigurationCreate | BomConfigurationUpdate = {
      name: v[BomConfigFormField.NAME],
      partNumberCell: this.buildCell(
        v[BomConfigFormField.PART_NUMBER_SHEET],
        v[BomConfigFormField.PART_NUMBER_COLUMN],
        v[BomConfigFormField.PART_NUMBER_ROW],
      ),
      revisionCell: this.buildCell(
        v[BomConfigFormField.REVISION_SHEET],
        v[BomConfigFormField.REVISION_COLUMN],
        v[BomConfigFormField.REVISION_ROW],
      ),
      descriptionCell: this.buildCell(
        v[BomConfigFormField.DESCRIPTION_SHEET],
        v[BomConfigFormField.DESCRIPTION_COLUMN],
        v[BomConfigFormField.DESCRIPTION_ROW],
      ),
      materials: {
        sheetNumber: v[BomConfigFormField.MATERIALS_SHEET] ?? 1,
        startAtRowNumber: v[BomConfigFormField.MATERIALS_START_ROW] ?? 1,
        manufacturerNameColumnNumber:
          v[BomConfigFormField.MFG_NAME_COLUMN] ?? undefined,
        manufacturerPartNumberColumnNumber:
          v[BomConfigFormField.MFG_PN_COLUMN] ?? undefined,
        descriptionColumnNumber:
          v[BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN] ?? undefined,
        quantityColumnNumber:
          v[BomConfigFormField.QUANTITY_COLUMN] ?? undefined,
        unitColumnNumber: v[BomConfigFormField.UNIT_COLUMN] ?? undefined,
      },
    };

    if (this.editMode()) {
      this.bomConfigRepo
        .update(this.configEdited!.uid, body as BomConfigurationUpdate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage(
              `BOM Configuration "${v[BomConfigFormField.NAME]}" updated`,
            );
            this.closeDialog(true);
          },
        });
    } else {
      this.bomConfigRepo
        .create(body as BomConfigurationCreate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage("BOM Configuration created");
            this.closeDialog(true);
          },
        });
    }
  }

  private patchForm(config: BomConfiguration): void {
    this.form.patchValue({
      [BomConfigFormField.NAME]: config.name ?? "",
      [BomConfigFormField.PART_NUMBER_SHEET]:
        config.partNumberCell?.sheetNumber ?? null,
      [BomConfigFormField.PART_NUMBER_COLUMN]:
        config.partNumberCell?.columnNumber ?? null,
      [BomConfigFormField.PART_NUMBER_ROW]:
        config.partNumberCell?.rowNumber ?? null,
      [BomConfigFormField.REVISION_SHEET]:
        config.revisionCell?.sheetNumber ?? null,
      [BomConfigFormField.REVISION_COLUMN]:
        config.revisionCell?.columnNumber ?? null,
      [BomConfigFormField.REVISION_ROW]: config.revisionCell?.rowNumber ?? null,
      [BomConfigFormField.DESCRIPTION_SHEET]:
        config.descriptionCell?.sheetNumber ?? null,
      [BomConfigFormField.DESCRIPTION_COLUMN]:
        config.descriptionCell?.columnNumber ?? null,
      [BomConfigFormField.DESCRIPTION_ROW]:
        config.descriptionCell?.rowNumber ?? null,
      [BomConfigFormField.MATERIALS_SHEET]:
        config.materials?.sheetNumber ?? null,
      [BomConfigFormField.MATERIALS_START_ROW]:
        config.materials?.startAtRowNumber ?? null,
      [BomConfigFormField.MFG_NAME_COLUMN]:
        config.materials?.manufacturerNameColumnNumber ?? null,
      [BomConfigFormField.MFG_PN_COLUMN]:
        config.materials?.manufacturerPartNumberColumnNumber ?? null,
      [BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN]:
        config.materials?.descriptionColumnNumber ?? null,
      [BomConfigFormField.QUANTITY_COLUMN]:
        config.materials?.quantityColumnNumber ?? null,
      [BomConfigFormField.UNIT_COLUMN]:
        config.materials?.unitColumnNumber ?? null,
    });
  }

  private buildCell(
    sheetNumber: number | null,
    columnNumber: number | null,
    rowNumber: number | null,
  ):
    | { sheetNumber: number; columnNumber: number; rowNumber: number }
    | undefined {
    if (sheetNumber == null || columnNumber == null || rowNumber == null)
      return undefined;
    return { sheetNumber, columnNumber, rowNumber };
  }
}
