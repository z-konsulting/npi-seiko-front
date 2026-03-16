import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import {
  CostingMethodType,
  CostRequestLine,
  CostRequestLineCreate,
  CostRequestLineUpdate,
  CostRequestStatus,
  Currency,
  FileInfo,
  ProductName,
} from "../../../../client/costSeiko";
import { EnumTransformerService } from "../../../services/components/enum-transformer.service";
import { CRMethodTypePipe } from "../../../pipes/cr-method-type.pipe";
import { CostRequestStatusPipe } from "../../../pipes/cost-request-status.pipe";
import { CostRequestLineFormField } from "../../../models/enums/form-field-names/cost-request-form-field";
import { AutoComplete } from "primeng/autocomplete";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { Select } from "primeng/select";
import { OverlayBadge } from "primeng/overlaybadge";
import { ModalService } from "../../../services/components/modal.service";
import { environment } from "../../../../environments/environment";
import { forkJoin, of, switchMap, tap } from "rxjs";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { ProductNameRepo } from "../../../repositories/product-name.repo";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { CostRequestService } from "../../../services/cost-request.service";

@Component({
  selector: "app-cost-request-line-edit-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    AutoComplete,
    Select,
    OverlayBadge,
    NoDoubleClickDirective,
    CRMethodTypePipe,
  ],
  templateUrl: "./cost-request-line-edit-dialog.component.html",
  styleUrl: "./cost-request-line-edit-dialog.component.scss",
  providers: [CostRequestStatusPipe, CRMethodTypePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestLineEditDialogComponent
  extends BaseModal
  implements OnInit
{
  lineForm!: FormGroup;
  lineEdited?: CostRequestLine;
  costRequestUid?: string;
  editMode = signal<boolean>(false);
  viewOnly = signal<boolean>(false);
  statusOptions = signal<{ label: string; value: string }[]>([]);
  methodTypeOptions = signal<{ label: string; value: string }[]>([]);
  currencies = signal<Currency[]>([]);
  productNames = signal<ProductName[]>([]);
  filesIds = signal<string[]>([]);
  urlFiles = signal<string>("");
  costRequestStatus = signal<CostRequestStatus | undefined>(undefined);
  protected readonly Icons = Icons;
  protected readonly CostRequestLineFormField = CostRequestLineFormField;
  protected readonly RegexPatterns = RegexPatterns;
  protected readonly CostingMethodType = CostingMethodType;
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private enumTransformer = inject(EnumTransformerService);
  private costRequestStatusPipe = inject(CostRequestStatusPipe);
  private costRequestService = inject(CostRequestService);
  isFinalized = computed(() => {
    const status = this.costRequestStatus();
    if (!status) return false;
    return this.costRequestService.allDataFreezeStatus(status);
  });
  private crMethodTypePipe = inject(CRMethodTypePipe);
  private productNameRepo = inject(ProductNameRepo);
  private modalService = inject(ModalService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      this.viewOnly.set(config.viewOnly || false);
      this.costRequestUid = config.costRequestUid;
      this.costRequestStatus.set(config.costRequestStatus);
      if (this.editMode()) {
        this.lineEdited = config.line;
      }
    }
    this.lineForm = this.formService.buildCostRequestLineForm(this.lineEdited);

    // Disable form if viewOnly or finalized
    if (this.viewOnly() || this.isFinalized()) {
      this.lineForm.disable();
    }
    this.urlFiles.set(
      `${environment.backendUrl}/cost-requests/${this.costRequestUid}/lines/${this.lineEdited?.uid}/files`,
    );
    this.initializeDropdownOptions();
    this.loadAllData();
  }

  initializeDropdownOptions() {
    this.statusOptions.set(
      this.enumTransformer.enumToLabelValue(
        CostRequestStatus,
        (value: CostRequestStatus) =>
          this.costRequestStatusPipe.transform(value),
      ),
    );
    this.methodTypeOptions.set(
      this.enumTransformer.enumToLabelValue(
        CostingMethodType,
        (value: CostingMethodType) => this.crMethodTypePipe.transform(value),
      ),
    );
  }

  addQuantities(event: any): void {
    const quantityAdded = event.value;
    const control = this.lineForm.get(CostRequestLineFormField.QUANTITIES);

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
      return;
    }
  }

  manageFiles() {
    if (this.editMode()) {
      // Edit mode: load existing files and use specific endpoints for download/delete
      this.costRequestLineRepo
        .getAllCostRequestLineFiles(this.costRequestUid!, this.lineEdited!.uid)
        .pipe(
          switchMap((files: FileInfo[]) => {
            return this.modalService.showManageFileModal(
              this.urlFiles(),
              files,
              this.viewOnly(),
              true,
            );
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((returnedFiles?: FileInfo[]) => {
          if (returnedFiles) {
            this.filesIds.set(returnedFiles.map((file) => file.uid));
          }
        });
    } else {
      // Create mode: use temporary files
      const files: FileInfo[] = this.filesIds().map((uid) => ({
        uid,
        fileName: "",
        type: "DRAWINGS" as any,
      }));
      const urlFiles = `${environment.backendUrl}/temporary-files`;
      this.modalService
        .showManageFileModal(urlFiles, files, false, false)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((returnedFiles?: FileInfo[]) => {
          if (returnedFiles) {
            this.filesIds.set(returnedFiles.map((file) => file.uid));
          }
        });
    }
  }

  createEditLine() {
    if (this.lineForm.invalid || !this.costRequestUid) {
      return;
    }
    const productName: ProductName | undefined = this.lineForm.get(
      CostRequestLineFormField.PRODUCT_NAME,
    )?.value;

    const lineData: CostRequestLineCreate | CostRequestLineUpdate = {
      customerPartNumber: this.lineForm.get(
        CostRequestLineFormField.CUSTOMER_PART_NUMBER,
      )?.value,
      customerPartNumberRevision: this.lineForm.get(
        CostRequestLineFormField.CUSTOMER_PART_NUMBER_REVISION,
      )?.value,
      description: this.lineForm.get(CostRequestLineFormField.DESCRIPTION)
        ?.value,
      quantities: this.lineForm.get(CostRequestLineFormField.QUANTITIES)?.value,
      costingMethodType: this.lineForm.get(
        CostRequestLineFormField.CR_METHOD_TYPE,
      )?.value,
      productNameId: productName?.uid,
      ...(!this.editMode()
        ? { materialLines: [], filesIds: this.filesIds() }
        : {}),
    };

    if (this.editMode() && this.lineEdited) {
      this.editLine(lineData);
    } else {
      this.createLine(lineData);
    }
  }

  createLine(lineData: any) {
    this.costRequestLineRepo
      .createCostRequestLine(this.costRequestUid!, lineData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation line created",
          );
          this.closeDialog(true);
        },
      });
  }

  editLine(lineData: any) {
    this.costRequestLineRepo
      .updateCostRequestLine(
        this.costRequestUid!,
        this.lineEdited!.uid,
        lineData,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            "Request for quotation line updated",
          );
          this.closeDialog(true);
        },
      });
  }

  private loadAllData() {
    const productNames$ = this.productNameRepo.listAllProductNames().pipe(
      tap((productNames) => {
        this.productNames.set(productNames);
      }),
    );

    const files$ =
      this.editMode() && this.lineEdited
        ? this.costRequestLineRepo
            .getAllCostRequestLineFiles(
              this.costRequestUid!,
              this.lineEdited!.uid,
            )
            .pipe(
              tap((returnedFiles?: FileInfo[]) => {
                if (returnedFiles) {
                  this.filesIds.set(returnedFiles.map((file) => file.uid));
                }
              }),
            )
        : of(undefined);

    forkJoin({
      productNames: productNames$,
      files: files$,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.setSelectedProductName();
        this.cdr.detectChanges();
      });
  }

  private setSelectedProductName() {
    const defaultProductName = this.productNames().find(
      (productName: ProductName) =>
        productName.uid === this.lineEdited?.productName?.uid,
    );
    if (defaultProductName) {
      this.lineForm
        .get(CostRequestLineFormField.PRODUCT_NAME)
        ?.setValue(defaultProductName);
    }
  }
}
