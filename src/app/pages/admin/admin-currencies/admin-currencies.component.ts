import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { SelectButtonModule } from "primeng/selectbutton";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { CurrenciesPaginated, Currency } from "../../../../client/costSeiko";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { FormsModule } from "@angular/forms";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { DatePipe, DecimalPipe } from "@angular/common";
import { Popover } from "primeng/popover";
import { Tag } from "primeng/tag";

@Component({
  selector: "app-admin-currencies",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    SelectButtonModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
    FormsModule,
    DatePipe,
    Tag,
    Popover,
    DecimalPipe,
  ],
  templateUrl: "./admin-currencies.component.html",
  styleUrl: "./admin-currencies.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCurrenciesComponent
  extends BaseListComponent
  implements OnInit
{
  currencies = signal<Currency[]>([]);
  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private currencyRepo = inject(CurrencyRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_CURRENCIES);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.currencyRepo
      .searchCurrencies(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: CurrenciesPaginated) => {
        this.currencies.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  archiveCurrency(currency: Currency) {
    this.currencyRepo
      .archiveCurrency(currency.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Currency ${currency.code} archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createCurrency() {
    this.modalService
      .showCurrencyCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editCurrency(currency: Currency) {
    this.modalService
      .showCurrencyCreateEditModal(true, currency)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  viewHistory(currency: Currency) {
    this.modalService
      .showCurrencyHistoryModal(currency)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
