import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import {
  CurrencyFormField,
  ExchangeRateFormField,
} from "../../../models/enums/form-field-names/currency-form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import {
  Currency,
  ExchangeRateCreate,
  ExchangeRateUpdate,
} from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { InputText } from "primeng/inputtext";
import { RegexPatterns } from "../../../services/utils/regex-patterns";

@Component({
  selector: "app-currency-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputNumberModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
    InputText,
  ],
  templateUrl: "./currency-create-edit-dialog.component.html",
  styleUrl: "./currency-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  currencyForm!: FormGroup;
  currencyEdited?: Currency;
  editMode = signal<boolean>(false);
  availableCurrencies = signal<Currency[]>([]);

  protected readonly Icons = Icons;
  protected readonly CurrencyFormField = CurrencyFormField;
  protected readonly RegexPatterns = RegexPatterns;
  private currencyRepo = inject(CurrencyRepo);

  constructor() {
    super();
  }

  get exchangeRatesArray(): FormArray {
    return this.currencyForm.get(CurrencyFormField.EXCHANGE_RATES) as FormArray;
  }

  ngOnInit() {
    this.currencyForm = this.formService.buildCurrencyForm();

    if (this.config.data) {
      const config = this.config.data;
      this.editMode.set(config.editMode);
      if (this.editMode()) {
        this.currencyEdited = this.config.data.currency;
      }
    }

    this.loadAvailableCurrencies();
  }

  loadAvailableCurrencies() {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        // Filter out the currency being edited
        const currencies = this.editMode()
          ? result.filter((c) => c.uid !== this.currencyEdited!.uid)
          : result;

        this.availableCurrencies.set(currencies);
        this.initializeExchangeRatesFormArray();

        if (this.editMode()) {
          this.updateEditableCurrencyForm();
        }
      });
  }

  initializeExchangeRatesFormArray() {
    const exchangeRatesArray = this.currencyForm.get(
      CurrencyFormField.EXCHANGE_RATES,
    ) as FormArray;
    exchangeRatesArray.clear();

    this.availableCurrencies().forEach((currency) => {
      const existingRate = this.editMode()
        ? this.currencyEdited!.exchangeRates.find(
            (er) => er.toCurrencyCode === currency.code,
          )
        : null;

      exchangeRatesArray.push(
        this.formService.buildExchangeRateFormGroup(
          currency.uid,
          existingRate ? parseFloat(existingRate.rate as any) : undefined,
        ),
      );
    });
  }

  updateEditableCurrencyForm() {
    if (this.currencyEdited) {
      this.currencyForm.patchValue({
        [CurrencyFormField.CODE]: this.currencyEdited.code,
      });
    }
  }

  getCurrencyByIndex(index: number): Currency | undefined {
    return this.availableCurrencies()[index];
  }

  createEditCurrency() {
    if (this.currencyForm.invalid) {
      return;
    }

    const code = this.currencyForm.get(CurrencyFormField.CODE)?.value;
    const exchangeRatesArray = this.currencyForm.get(
      CurrencyFormField.EXCHANGE_RATES,
    ) as FormArray;

    const exchangeRates: ExchangeRateCreate[] | ExchangeRateUpdate[] =
      exchangeRatesArray.controls.map(
        (er) =>
          ({
            toCurrencyId: er.get(ExchangeRateFormField.TO_CURRENCY_UID)?.value,
            rate: er.get(ExchangeRateFormField.RATE)?.value,
          }) as ExchangeRateCreate | ExchangeRateUpdate,
      );

    if (this.editMode()) {
      this.editCurrency(code, exchangeRates as ExchangeRateUpdate[]);
    } else {
      this.createCurrency(code, exchangeRates as ExchangeRateCreate[]);
    }
  }

  createCurrency(code: string, exchangeRates: ExchangeRateCreate[]) {
    this.currencyRepo
      .createCurrency(code, exchangeRates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Currency created");
          this.closeDialog(true);
        },
      });
  }

  editCurrency(code: string, exchangeRates: ExchangeRateUpdate[]) {
    this.currencyRepo
      .updateCurrency(this.currencyEdited!.uid, code, exchangeRates)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Currency ${this.currencyEdited?.code} updated`,
          );
          this.closeDialog(true);
        },
      });
  }
}
