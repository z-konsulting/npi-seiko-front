import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from "@angular/forms";
import { debounceTime } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BomConfigFormField } from "../../models/enums/form-field-names/bom-configuration-form-field";
import { Icons } from "../../models/enums/icons";
import { Button } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "app-bom-mapping-form",
  imports: [ReactiveFormsModule, Button, InputNumberModule, TooltipModule],
  templateUrl: "./bom-mapping-form.component.html",
  styleUrl: "./bom-mapping-form.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class BomMappingFormComponent implements OnInit {
  private readonly controlContainer = inject(ControlContainer);
  private readonly destroyRef = inject(DestroyRef);

  private get parentForm(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  private formValues = signal<Record<string, unknown>>({});

  protected readonly Icons = Icons;
  protected readonly BomConfigFormField = BomConfigFormField;

  readonly partNumberColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.PART_NUMBER_COLUMN] as number),
  );
  readonly revisionColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.REVISION_COLUMN] as number),
  );
  readonly descriptionColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.DESCRIPTION_COLUMN] as number),
  );
  readonly mfgNameColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.MFG_NAME_COLUMN] as number),
  );
  readonly mfgPnColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.MFG_PN_COLUMN] as number),
  );
  readonly materialsDescColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.MATERIALS_DESCRIPTION_COLUMN] as number),
  );
  readonly quantityColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.QUANTITY_COLUMN] as number),
  );
  readonly unitColumnLetter = computed(() =>
    this.columnToLetter(this.formValues()[BomConfigFormField.UNIT_COLUMN] as number),
  );

  ngOnInit(): void {
    this.formValues.set(this.parentForm.value);
    this.parentForm.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((values) => this.formValues.set(values));
  }

  applyHeaderRowToAll(): void {
    const partNumberRow = this.parentForm.get(BomConfigFormField.PART_NUMBER_ROW)?.value;
    if (partNumberRow != null) {
      this.parentForm.patchValue({
        [BomConfigFormField.REVISION_ROW]: partNumberRow,
        [BomConfigFormField.DESCRIPTION_ROW]: partNumberRow,
      });
    }
  }

  columnToLetter(col: number | null | undefined): string {
    if (col == null || col < 1) return "";
    let result = "";
    let n = col;
    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  }
}
