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
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { ModalService } from "../../../services/components/modal.service";
import { SelectButtonModule } from "primeng/selectbutton";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { Customer, CustomersPaginated } from "../../../../client/costSeiko";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { switchMap } from "rxjs";
import { Chip } from "primeng/chip";
import { OverlayBadge } from "primeng/overlaybadge";
import { CustomerRepo } from "../../../repositories/customer.repo";

@Component({
  selector: "app-admin-customers",
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
    CheckboxModule,
    Chip,
    OverlayBadge,
  ],
  templateUrl: "./admin-customers.component.html",
  styleUrl: "./admin-customers.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCustomersComponent
  extends BaseListComponent
  implements OnInit
{
  customers = signal<Customer[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private customerRepo = inject(CustomerRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_CUSTOMERS);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.customerRepo
      .searchCustomers(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: CustomersPaginated) => {
        this.customers.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  archiveCustomer(customer: Customer) {
    this.customerRepo
      .archiveCustomer(customer.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Customer ${customer.name} archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createCustomer() {
    this.modalService
      .showCustomerCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  openCustomerContacts(customer: Customer) {
    this.modalService
      .showCustomerContactsModal(customer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openTermsAndConditions(customer: Customer) {
    this.modalService
      .showCustomerTermsAndConditionsModal(customer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openShipmentLocations(customer: Customer) {
    this.modalService
      .showCustomerShipmentLocationsModal(customer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  editCustomer(customer: Customer) {
    this.customerRepo
      .getCustomer(customer.uid)
      .pipe(
        switchMap((cust) =>
          this.modalService.showCustomerCreateEditModal(true, cust),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }
}
