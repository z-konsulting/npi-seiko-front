import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { Currency, ExchangeRateHistory } from "../../../../client/costSeiko";
import { BaseModal } from "../../../models/classes/base-modal";
import { TableModule } from "primeng/table";
import { DatePipe, DecimalPipe } from "@angular/common";
import { Tag } from "primeng/tag";
import { TableColsTitle } from "../../../models/enums/table-cols-title";

@Component({
  selector: "app-currency-history-dialog",
  imports: [CardModule, TableModule, DatePipe, DecimalPipe, Tag],
  templateUrl: "./currency-history-dialog.component.html",
  styleUrl: "./currency-history-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyHistoryDialogComponent
  extends BaseModal
  implements OnInit
{
  currency?: Currency;
  history = signal<ExchangeRateHistory[]>([]);
  loading = signal<boolean>(true);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;

  private currencyRepo = inject(CurrencyRepo);

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.config.data) {
      this.currency = this.config.data.currency;
      this.loadHistory();
    }
  }

  loadHistory() {
    if (!this.currency) {
      return;
    }

    this.loading.set(true);
    this.currencyRepo
      .getCurrencyHistory(this.currency.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.history.set(result);
          this.loading.set(false);
        },
      });
  }
}
