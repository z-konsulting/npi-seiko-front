import { Component, inject, input, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";
import { NgClass } from "@angular/common";
import { Button } from "primeng/button";
import { Icons } from "../../../../models/enums/icons";
import { RegexPatterns } from "../../../../services/utils/regex-patterns";
import { Tooltip } from "primeng/tooltip";
import {
  CostRequestFormField,
  CostRequestLineFormField,
} from "../../../../models/enums/form-field-names/cost-request-form-field";
import { NoDoubleClickDirective } from "../../../../directives/no-double-click.directive";
import { InputContainerComponent } from "../../../../components/input-container/input-container.component";
import { BaseModal } from "../../../../models/classes/base-modal";
import { Select } from "primeng/select";
import {
  CostingMethodType,
  FileInfo,
  ProductName,
} from "../../../../../client/costSeiko";
import { CRMethodTypePipe } from "../../../../pipes/cr-method-type.pipe";
import { EnumTransformerService } from "../../../../services/components/enum-transformer.service";
import { AutoComplete } from "primeng/autocomplete";
import { OverlayBadge } from "primeng/overlaybadge";
import { ModalService } from "../../../../services/components/modal.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { environment } from "../../../../../environments/environment";

@Component({
  selector: "app-cost-request-create-line-requested",
  imports: [
    ReactiveFormsModule,
    Accordion,
    AccordionPanel,
    NgClass,
    AccordionHeader,
    Button,
    AccordionContent,
    Tooltip,
    NoDoubleClickDirective,
    InputContainerComponent,
    Select,
    AutoComplete,
    OverlayBadge,
  ],
  templateUrl: "./cost-request-create-line-requested.component.html",
  styleUrl: "./cost-request-create-line-requested.component.scss",
  providers: [CRMethodTypePipe],
})
export class CostRequestCreateLineRequestedComponent
  extends BaseModal
  implements OnInit
{
  validated = input(false);
  costRequestForm = input.required<FormGroup>();
  productNames = input.required<ProductName[]>();
  showAccordion: boolean = false;
  methodTypeOptions: { label: string; value: string }[] = [];
  activeIndex = 0;
  protected readonly Icons = Icons;
  protected readonly RegexPatterns = RegexPatterns;
  protected readonly CostRequestLineFormField = CostRequestLineFormField;
  protected readonly CostRequestFormField = CostRequestFormField;
  private readonly confirmationService = inject(ConfirmationService);
  private readonly modalService = inject(ModalService);
  private readonly enumTransformer = inject(EnumTransformerService);
  private readonly crMethodTypePipe = inject(CRMethodTypePipe);

  get linesFormArray(): FormArray {
    return this.costRequestForm().get(CostRequestFormField.LINES) as FormArray;
  }

  ngOnInit() {
    this.methodTypeOptions = this.enumTransformer.enumToLabelValue(
      CostingMethodType,
      (value: CostingMethodType) => this.crMethodTypePipe.transform(value),
    );
    setTimeout(() => {
      this.showAccordion = true;
    }, 100);
  }

  addLine() {
    const lineForm = this.formService.buildCostRequestLineForm();
    this.linesFormArray.push(lineForm);
    this.activeIndex = this.linesFormArray.length - 1;
    console.log(this.activeIndex);
  }

  addQuantities(event: any, parentIndex: number): void {
    const lineForm = this.getLineForm(parentIndex);
    const quantityAdded = event.value;
    const control = lineForm.get(CostRequestLineFormField.QUANTITIES);

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

  copyPNLine(parentIndex: number, event: any) {
    const lineForm = this.getLineForm(parentIndex);
    const newPNLine = this.formService.buildCostRequestLineForm() as FormGroup;
    newPNLine.patchValue(lineForm.value);
    newPNLine.get(CostRequestLineFormField.CUSTOMER_PART_NUMBER)?.reset();
    newPNLine
      .get(CostRequestLineFormField.CUSTOMER_PART_NUMBER_REVISION)
      ?.reset();
    this.linesFormArray.push(newPNLine);
    this.activeIndex = this.linesFormArray.length - 1;
    event.stopPropagation();
  }

  removeLine(index: number) {
    this.linesFormArray.removeAt(index);
  }

  getLineForm(index: number): FormGroup {
    return this.linesFormArray.at(index) as FormGroup;
  }

  confirmRemovePNLineRequest(
    line: AbstractControl<any>,
    index: number,
    event: any,
  ): void {
    const lineRequest =
      line.get(CostRequestLineFormField.CUSTOMER_PART_NUMBER)?.value ?? "";
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${lineRequest}?`,
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: {
        label: "No",
        outlined: true,
      },
      accept: () => {
        this.removeLine(index);
      },
    });
    event.stopPropagation();
  }

  manageFiles(parentIndex: number, event: any): void {
    const lineForm = this.getLineForm(parentIndex);
    const files: FileInfo[] =
      lineForm.get(CostRequestLineFormField.FILES)?.value ?? [];
    const urlFiles = `${environment.backendUrl}/temporary-files`;
    this.modalService
      .showManageFileModal(urlFiles, files, false, true, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((returnedFiles?: FileInfo[]) => {
        if (returnedFiles) {
          lineForm.get(CostRequestLineFormField.FILES)?.setValue(returnedFiles);
        }
      });
    event.stopPropagation();
  }
}
