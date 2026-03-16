import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from "@angular/core";
import { FormArray, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { BaseModal } from "../../../models/classes/base-modal";
import { Icons } from "../../../models/enums/icons";
import {
  GenerateQuotationPdfFormField,
  QuotationLineExtraInfoFormField,
} from "../../../models/enums/form-field-names/generate-quotation-pdf-form-field";
import {
  CostRequest,
  CostRequestLine,
  GenerateQuotationPdfBody,
} from "../../../../client/costSeiko";
import { LeadTimeType } from "../../../models/lead-time-type";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-generate-quotation-pdf-dialog",
  imports: [
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    TooltipModule,
  ],
  templateUrl: "./generate-quotation-pdf-dialog.component.html",
  styleUrl: "./generate-quotation-pdf-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateQuotationPdfDialogComponent
  extends BaseModal
  implements OnInit
{
  costRequest: CostRequest = this.config.data.costRequest;

  form: FormGroup = this.formService.buildGenerateQuotationPdfForm();

  protected readonly Icons = Icons;
  protected readonly Field = GenerateQuotationPdfFormField;
  protected readonly LineField = QuotationLineExtraInfoFormField;
  protected readonly leadTimeUnits: LeadTimeType[] = [
    "weeks",
    "months",
    "quarter",
  ];
  private costRequestRepo = inject(CostRequestRepo);

  get lines(): CostRequestLine[] {
    return this.costRequest.lines ?? [];
  }

  get lineExtraInfos(): FormArray {
    return this.form.get(
      GenerateQuotationPdfFormField.LINE_EXTRA_INFOS,
    ) as FormArray;
  }

  get customerDefaultPaymentTerms(): string | undefined {
    return this.costRequest.customer.paymentTerms;
  }

  ngOnInit(): void {
    if (this.costRequest.customer.paymentTerms) {
      this.form
        .get(GenerateQuotationPdfFormField.PAYMENT_TERMS)
        ?.setValue(this.costRequest.customer.paymentTerms);
    }

    this.lines.forEach(() => {
      this.lineExtraInfos.push(
        this.formService.buildQuotationLineExtraInfoForm(),
      );
    });
    this.getGlobalComment();
  }

  getGlobalComment() {
    this.costRequestRepo
      .getCostRequestSubstituteMaterialsComment(this.costRequest.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((comment) => {
        if (comment) {
          this.form
            .get(GenerateQuotationPdfFormField.GLOBAL_COMMENT)
            ?.setValue(comment.comment);
        }
      });
  }

  lineGroup(index: number): FormGroup {
    return this.lineExtraInfos.at(index) as FormGroup;
  }

  setLeadTimeUnit(lineIndex: number, unit: string): void {
    const ctrl = this.lineGroup(lineIndex).get(
      QuotationLineExtraInfoFormField.LEAD_TIME_UNIT,
    );
    ctrl?.setValue(unit);
  }

  getLeadTimeUnit(lineIndex: number): string {
    return (
      this.lineGroup(lineIndex).get(
        QuotationLineExtraInfoFormField.LEAD_TIME_UNIT,
      )?.value ?? ""
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formService.trimFormStringValues(this.form);

    const body: GenerateQuotationPdfBody = {
      paymentTerms:
        this.form.get(GenerateQuotationPdfFormField.PAYMENT_TERMS)?.value ?? "",
      preparedBy:
        this.form.get(GenerateQuotationPdfFormField.PREPARED_BY)?.value ?? "",
      approvedBy:
        this.form.get(GenerateQuotationPdfFormField.APPROVED_BY)?.value ?? "",
      globalComment:
        this.form.get(GenerateQuotationPdfFormField.GLOBAL_COMMENT)?.value ??
        "",
      lineExtraInfos: this.lineExtraInfos.controls.map((ctrl) => {
        const ltValue = ctrl.get(
          QuotationLineExtraInfoFormField.LEAD_TIME_VALUE,
        )?.value;
        const ltUnit = ctrl.get(
          QuotationLineExtraInfoFormField.LEAD_TIME_UNIT,
        )?.value;
        const leadTime =
          ltValue != null && ltValue !== "" && ltUnit
            ? `${ltValue} ${ltUnit}`
            : "";
        return {
          leadTime,
          remarks:
            ctrl.get(QuotationLineExtraInfoFormField.REMARKS)?.value || "",
        };
      }),
    };

    this.closeDialog(body);
  }
}
