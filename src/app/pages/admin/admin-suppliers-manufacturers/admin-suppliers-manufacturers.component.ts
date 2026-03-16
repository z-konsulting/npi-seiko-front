import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
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
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import {
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
  SuppliersAndManufacturersPaginated,
} from "../../../../client/costSeiko";
import { switchMap } from "rxjs";
import { SupplierManufacturerRepo } from "../../../repositories/supplier-manufacturer.repo";
import { SupplierAndManufacturerTypePipe } from "../../../pipes/supplier-and-manufacturer-type.pipe";
import { Chip } from "primeng/chip";
import { AuthenticationService } from "../../../security/authentication.service";
import { AccessService } from "../../../services/Access.service";
import { QueryParamKey } from "../../../models/enums/queryParamKey";

@Component({
  selector: "app-admin-suppliers-manufacturers",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
    SupplierAndManufacturerTypePipe,
    Chip,
  ],
  templateUrl: "./admin-suppliers-manufacturers.component.html",
  styleUrl: "./admin-suppliers-manufacturers.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSuppliersManufacturersComponent
  extends BaseListComponent
  implements OnInit
{
  items = signal<SupplierAndManufacturer[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;
  protected readonly SupplierAndManufacturerType = SupplierAndManufacturerType;

  private supplierManufacturerRepo = inject(SupplierManufacturerRepo);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);
  private authService = inject(AuthenticationService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  protected isAdmin = computed(() => {
    const role = this.authService.getRole();
    return role != null && (AccessService.isAdministrator(role) || AccessService.isSuperAdmin(role));
  });

  constructor() {
    super();
    this.title = RoutingService.getRouteTitle(
      RouteId.ADMIN_SUPPLIERS_MANUFACTURERS,
    );
  }

  ngOnInit() {
    this.loading = true;
    const manufacturerName = this.activatedRoute.snapshot.queryParamMap.get(
      QueryParamKey.MANUFACTURER_NAME,
    );
    if (manufacturerName) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.modalService
        .showSupplierManufacturerCreateEditModal(false, undefined, {
          name: manufacturerName,
          type: SupplierAndManufacturerType.MANUFACTURER,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((created?: boolean) => {
          if (created) {
            this.loadData(this.lastTableLazyLoadEvent);
          }
        });
    }
  }

  override loadData(event: TableLazyLoadEvent): void {
    super.loadData(event);
    this.supplierManufacturerRepo
      .searchSuppliersManufacturers(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: SuppliersAndManufacturersPaginated) => {
        this.items.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  createItem() {
    this.modalService
      .showSupplierManufacturerCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editItem(item: SupplierAndManufacturer) {
    this.supplierManufacturerRepo
      .retrieveSupplierManufacturer(item.uid)
      .pipe(
        switchMap((retrieved) =>
          this.modalService.showSupplierManufacturerCreateEditModal(
            true,
            retrieved,
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  archiveItem(item: SupplierAndManufacturer) {
    this.supplierManufacturerRepo
      .archiveSupplierManufacturer(item.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(`"${item.name}" archived`);
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  getTypeChipClass(type: SupplierAndManufacturerType): string {
    switch (type) {
      case SupplierAndManufacturerType.SUPPLIER:
        return "chip--info";
      case SupplierAndManufacturerType.MANUFACTURER:
        return "chip--contrast";
      case SupplierAndManufacturerType.BOTH:
        return "chip--secondary";
      default:
        return "";
    }
  }
}
