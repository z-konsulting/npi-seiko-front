import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { BomConfigFormField } from "../../../models/enums/form-field-names/bom-configuration-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BomConfigurationRepo } from "../../../repositories/bom-configuration.repo";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import {
  BomConfiguration,
  BomConfigurationForImport,
  CostingMethodType,
  CustomBomImportBody,
  FileInfo,
  FileType,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { Select } from "primeng/select";
import { AutoComplete } from "primeng/autocomplete";
import { Fieldset } from "primeng/fieldset";
import {
  FileSelected,
  ManageFileComponent,
} from "../../../components/manage-file/manage-file.component";
import { BomMappingFormComponent } from "../../../components/bom-mapping-form/bom-mapping-form.component";
import { environment } from "../../../../environments/environment";
import { EnumTransformerService } from "../../../services/components/enum-transformer.service";
import { CRMethodTypePipe } from "../../../pipes/cr-method-type.pipe";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { FileManageRepo } from "../../../repositories/file-manage-repo";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { LoaderService } from "../../../services/components/loader.service";
import { finalize } from "rxjs";

@Component({
  selector: "app-custom-bom-import-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    Select,
    AutoComplete,
    Fieldset,
    ManageFileComponent,
    BomMappingFormComponent,
    NoDoubleClickDirective,
  ],
  providers: [CRMethodTypePipe],
  templateUrl: "./custom-bom-import-dialog.component.html",
  styleUrl: "./custom-bom-import-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomBomImportDialogComponent
  extends BaseModal
  implements OnInit
{
  @ViewChild(ManageFileComponent) manageFileRef!: ManageFileComponent;

  form!: FormGroup;
  costRequestUid!: string;
  filesPresents = signal<FileSelected[]>([]);

  // BOM configuration template selector
  configurations = signal<BomConfiguration[]>([]);
  selectedConfiguration = signal<BomConfiguration | null>(null);
  configFieldsetCollapsed = signal<boolean>(true);

  // File upload (single file, temp storage)
  readonly temporaryFilesUrl = `${environment.backendUrl}/temporary-files`;
  uploadedFileUid = signal<string | null>(null);
  hasPendingFile = signal<boolean>(false);

  // Costing method dropdown
  methodTypeOptions = signal<{ label: string; value: CostingMethodType }[]>([]);

  protected readonly Icons = Icons;
  protected readonly RegexPatterns = RegexPatterns;

  private bomConfigRepo = inject(BomConfigurationRepo);
  private costRequestRepo = inject(CostRequestRepo);
  private enumTransformer = inject(EnumTransformerService);
  private crMethodTypePipe = inject(CRMethodTypePipe);
  private fileManageRepo = inject(FileManageRepo);
  private loaderService = inject(LoaderService);

  ngOnInit(): void {
    this.costRequestUid = this.config.data?.costRequestUid;

    this.form = new FormGroup({
      // Header cells
      [BomConfigFormField.PART_NUMBER_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.PART_NUMBER_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.PART_NUMBER_ROW]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.REVISION_SHEET]: new FormControl<number | null>(null),
      [BomConfigFormField.REVISION_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.REVISION_ROW]: new FormControl<number | null>(null),
      [BomConfigFormField.DESCRIPTION_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.DESCRIPTION_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.DESCRIPTION_ROW]: new FormControl<number | null>(
        null,
      ),
      // Materials list
      [BomConfigFormField.MATERIALS_SHEET]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MATERIALS_START_ROW]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MFG_NAME_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.MFG_PN_COLUMN]: new FormControl<number | null>(null),
      [BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN]: new FormControl<
        number | null
      >(null),
      [BomConfigFormField.QUANTITY_COLUMN]: new FormControl<number | null>(
        null,
      ),
      [BomConfigFormField.UNIT_COLUMN]: new FormControl<number | null>(null),
      // Import-specific
      quantities: new FormControl<number[]>([], [Validators.required]),
      costingMethod: new FormControl<CostingMethodType>(CostingMethodType.HV, [
        Validators.required,
      ]),
    });

    this.methodTypeOptions.set(
      this.enumTransformer.enumToLabelValue(
        CostingMethodType,
        (v: CostingMethodType) => this.crMethodTypePipe.transform(v),
      ),
    );

    this.bomConfigRepo
      .listAllBomConfigurations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((configs) => this.configurations.set(configs));
  }

  onConfigurationSelected(config: BomConfiguration | null): void {
    this.selectedConfiguration.set(config);
    if (!config) {
      this.form.patchValue({
        [BomConfigFormField.PART_NUMBER_SHEET]: null,
        [BomConfigFormField.PART_NUMBER_COLUMN]: null,
        [BomConfigFormField.PART_NUMBER_ROW]: null,
        [BomConfigFormField.REVISION_SHEET]: null,
        [BomConfigFormField.REVISION_COLUMN]: null,
        [BomConfigFormField.REVISION_ROW]: null,
        [BomConfigFormField.DESCRIPTION_SHEET]: null,
        [BomConfigFormField.DESCRIPTION_COLUMN]: null,
        [BomConfigFormField.DESCRIPTION_ROW]: null,
        [BomConfigFormField.MATERIALS_SHEET]: null,
        [BomConfigFormField.MATERIALS_START_ROW]: null,
        [BomConfigFormField.MFG_NAME_COLUMN]: null,
        [BomConfigFormField.MFG_PN_COLUMN]: null,
        [BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN]: null,
        [BomConfigFormField.QUANTITY_COLUMN]: null,
        [BomConfigFormField.UNIT_COLUMN]: null,
      });
      this.configFieldsetCollapsed.set(true);
      return;
    }
    this.form.patchValue({
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
    this.configFieldsetCollapsed.set(false);
  }

  addQuantities(event: any): void {
    const quantityAdded = event.value;
    const control = this.form.get("quantities");
    if (!control) return;
    const quantities: string[] = [...(control.value ?? [])];
    const lastIndex = quantities.lastIndexOf(quantityAdded);
    const isValid = RegexPatterns.checkPositiveIntegerValid(quantityAdded);
    if (!isValid) {
      if (lastIndex !== -1) {
        quantities.splice(lastIndex, 1);
        control.setValue(quantities);
      }
      this.handleMessage.warningMessage("Invalid quantity");
    }
  }

  onFileUploaded(filesUploaded: FileInfo[]): void {
    if (filesUploaded.length === 0) return;
    const file: FileSelected = {
      ...filesUploaded[0],
      type: FileType.ANY,
      selected: false,
    };

    this.filesPresents.set([file]);
    this.uploadedFileUid.set(file.uid);
    this.hasPendingFile.set(false);
  }

  onPendingFileChange(pending: boolean): void {
    if (!this.uploadedFileUid()) {
      this.hasPendingFile.set(pending);
    }
  }

  downloadReceiver(filesUids: string[]) {
    if (!this.uploadedFileUid()) return;
    const url = `${this.temporaryFilesUrl}/download`;
    this.fileManageRepo.downloadFile(url, [this.uploadedFileUid()!]);
  }

  deletionReceiver(filesUids: string[]) {
    if (!this.uploadedFileUid()) return;
    const url = `${this.temporaryFilesUrl}/delete`;
    this.fileManageRepo
      .deleteFile(url, [this.uploadedFileUid()!])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.uploadedFileUid.set(null);
          this.hasPendingFile.set(false);
          this.filesPresents.set([]);
          this.handleMessage.successMessage("File(s) deleted");
        },
      });
  }

  import(): void {
    if (this.hasPendingFile()) {
      this.handleMessage.warningMessage(
        "A file is selected but not uploaded yet. Please upload the file before importing.",
      );
      return;
    }
    if (!this.uploadedFileUid()) {
      this.handleMessage.warningMessage(
        "Please upload a BOM file before importing.",
      );
      return;
    }
    const v = this.form.value;
    const bomConfig: BomConfigurationForImport = {
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
      materials:
        v[BomConfigFormField.MATERIALS_SHEET] != null
          ? {
              sheetNumber: v[BomConfigFormField.MATERIALS_SHEET],
              startAtRowNumber: v[BomConfigFormField.MATERIALS_START_ROW],
              manufacturerNameColumnNumber:
                v[BomConfigFormField.MFG_NAME_COLUMN] ?? undefined,
              manufacturerPartNumberColumnNumber:
                v[BomConfigFormField.MFG_PN_COLUMN] ?? undefined,
              descriptionColumnNumber:
                v[BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN] ?? undefined,
              quantityColumnNumber:
                v[BomConfigFormField.QUANTITY_COLUMN] ?? undefined,
              unitColumnNumber: v[BomConfigFormField.UNIT_COLUMN] ?? undefined,
            }
          : undefined,
    };

    const body: CustomBomImportBody = {
      temporaryFileId: this.uploadedFileUid()!,
      bomConfig,
      quantities: v["quantities"]?.length
        ? v["quantities"].map(Number)
        : undefined,
      costingMethod: v["costingMethod"] ?? undefined,
    };
    this.loaderService.showLoader("Uploading custom BOM...");
    this.costRequestRepo
      .uploadCustomBom(this.costRequestUid, body)
      .pipe(
        finalize(() => this.loaderService.hideLoader()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Custom BOM imported successfully");
          this.closeDialog(true);
        },
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
