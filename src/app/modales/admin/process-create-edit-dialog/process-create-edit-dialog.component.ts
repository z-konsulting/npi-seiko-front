import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { Checkbox } from "primeng/checkbox";
import { ProcessFormField } from "../../../models/enums/form-field-names/process-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ProcessRepo } from "../../../repositories/process.repo";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { Currency, Process } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { Select } from "primeng/select";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "app-process-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputNumberModule,
    ReactiveFormsModule,
    Button,
    Checkbox,
    InputContainerComponent,
    Select,
    Tooltip,
  ],
  templateUrl: "./process-create-edit-dialog.component.html",
  styleUrl: "./process-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  processForm!: FormGroup;
  processEdited?: Process;
  editMode = signal<boolean>(false);
  currencies = signal<Currency[]>([]);

  // Signals for the conversion display component
  selectedCurrency = signal<Currency | null>(null);
  costPerMinute = signal<number>(0);

  protected readonly Icons = Icons;
  protected readonly ProcessFormField = ProcessFormField;

  private processRepo = inject(ProcessRepo);
  private currencyRepo = inject(CurrencyRepo);

  constructor() {
    super();

    // Watch for form changes to update the conversion display
    effect(() => {
      if (this.processForm) {
        this.processForm
          .get(ProcessFormField.CURRENCY_UID)
          ?.valueChanges.subscribe((currency: Currency | null) => {
            this.selectedCurrency.set(currency);
          });

        this.processForm
          .get(ProcessFormField.COST_PER_SECOND)
          ?.valueChanges.subscribe((cost: number) => {
            this.costPerMinute.set(cost || 0);
          });
      }
    });
  }

  ngOnInit() {
    this.processForm = this.formService.buildProcessForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.processEdited = this.config.data.process;
      }
    }

    this.loadCurrencies();
  }

  loadCurrencies() {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.currencies.set(result);
        if (this.editMode()) {
          this.updateEditableProcessForm();
        } else {
          this.selectDefaultCurrency();
        }
      });
  }

  updateEditableProcessForm() {
    if (this.processEdited) {
      const selectedCurrency = this.currencies().find(
        (c) => c.uid === this.processEdited!.currency.uid,
      );
      this.processForm.patchValue({
        [ProcessFormField.NAME]: this.processEdited.name,
        [ProcessFormField.CURRENCY_UID]: selectedCurrency,
        [ProcessFormField.COST_PER_SECOND]: this.processEdited.costPerMinute,
        [ProcessFormField.DYSON_CYCLE_TIME_IN_SECONDS]:
          this.processEdited.dysonCycleTimeInSeconds ?? null,
        [ProcessFormField.NON_DYSON_CYCLE_TIME_IN_SECONDS]:
          this.processEdited.nonDysonCycleTimeInSeconds ?? null,
        [ProcessFormField.SETUP_PROCESS]:
          this.processEdited.setupProcess ?? false,
      });
      // Initialize signals with current values
      this.selectedCurrency.set(selectedCurrency || null);
      this.costPerMinute.set(Number(this.processEdited.costPerMinute));
    }
  }

  selectDefaultCurrency() {
    if (this.currencies().length > 0) {
      const defaultCurrency = this.currencies()[0];
      this.processForm.patchValue({
        [ProcessFormField.CURRENCY_UID]: defaultCurrency,
      });
      this.selectedCurrency.set(defaultCurrency);
    }
  }

  createEditProcess() {
    if (this.processForm.invalid) {
      return;
    }

    const name = this.processForm.get(ProcessFormField.NAME)?.value;
    const currency: Currency = this.processForm.get(
      ProcessFormField.CURRENCY_UID,
    )?.value;
    const costPerMinute = this.processForm.get(
      ProcessFormField.COST_PER_SECOND,
    )?.value;
    const dysonCycleTime: number =
      this.processForm.get(ProcessFormField.DYSON_CYCLE_TIME_IN_SECONDS)
        ?.value ?? 0;
    const nonDysonCycleTime: number =
      this.processForm.get(ProcessFormField.NON_DYSON_CYCLE_TIME_IN_SECONDS)
        ?.value ?? 0;
    const setupProcess: boolean =
      this.processForm.get(ProcessFormField.SETUP_PROCESS)?.value ?? false;

    if (this.editMode()) {
      this.editProcess(
        name,
        currency.uid,
        costPerMinute,
        dysonCycleTime,
        nonDysonCycleTime,
        setupProcess,
      );
    } else {
      this.createProcess(
        name,
        currency.uid,
        costPerMinute,
        dysonCycleTime,
        nonDysonCycleTime,
        setupProcess,
      );
    }
  }

  createProcess(
    name: string,
    currencyId: string,
    costPerMinute: number,
    dysonCycleTimeInSeconds: number,
    nonDysonCycleTimeInSeconds: number,
    setupProcess: boolean,
  ) {
    this.processRepo
      .createProcess(
        name,
        currencyId,
        costPerMinute,
        dysonCycleTimeInSeconds,
        nonDysonCycleTimeInSeconds,
        setupProcess,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Process created");
          this.closeDialog(true);
        },
      });
  }

  editProcess(
    name: string,
    currencyId: string,
    costPerMinute: number,
    dysonCycleTimeInSeconds: number,
    nonDysonCycleTimeInSeconds: number,
    setupProcess: boolean,
  ) {
    this.processRepo
      .updateProcess(
        this.processEdited!.uid,
        name,
        currencyId,
        costPerMinute,
        dysonCycleTimeInSeconds,
        nonDysonCycleTimeInSeconds,
        setupProcess,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Process ${this.processEdited?.name} updated`,
          );
          this.closeDialog(true);
        },
      });
  }
}
