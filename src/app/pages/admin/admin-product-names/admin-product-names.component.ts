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
import {
  ProductName,
  ProductNamesPaginated,
} from "../../../../client/costSeiko";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { FormsModule } from "@angular/forms";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { switchMap } from "rxjs";
import { ProductNameRepo } from "../../../repositories/product-name.repo";

@Component({
  selector: "app-admin-product-names",
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
  ],
  templateUrl: "./admin-product-names.component.html",
  styleUrl: "./admin-product-names.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductNamesComponent
  extends BaseListComponent
  implements OnInit
{
  productNames = signal<ProductName[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private productNameRepo = inject(ProductNameRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_PRODUCT_NAMES);
  }

  ngOnInit() {
    this.loading = true;
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.productNameRepo
      .searchProductNames(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: ProductNamesPaginated) => {
        this.productNames.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  deleteProductName(productName: ProductName) {
    this.productNameRepo
      .archiveProductName(productName.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Product name ${productName.name} deleted`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createProductName() {
    this.modalService
      .showProductNameCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editProductName(productName: ProductName) {
    this.productNameRepo
      .getProductName(productName.uid)
      .pipe(
        switchMap((pro) =>
          this.modalService.showProductNameCreateEditModal(true, pro),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }
}
