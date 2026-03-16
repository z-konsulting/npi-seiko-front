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
import { Unit, UnitsPaginated } from "../../../../client/costSeiko";
import { switchMap } from "rxjs";
import { UnitRepo } from "../../../repositories/unit.repo";
import { AuthenticationService } from "../../../security/authentication.service";
import { AccessService } from "../../../services/Access.service";
import { QueryParamKey } from "../../../models/enums/queryParamKey";

@Component({
  selector: "app-admin-units",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
  ],
  templateUrl: "./admin-units.component.html",
  styleUrl: "./admin-units.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUnitsComponent extends BaseListComponent implements OnInit {
  units = signal<Unit[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private unitRepo = inject(UnitRepo);
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
    this.title = RoutingService.getRouteTitle(RouteId.ADMIN_UNITS);
  }

  ngOnInit() {
    this.loading = true;
    const unitName = this.activatedRoute.snapshot.queryParamMap.get(
      QueryParamKey.UNIT_NAME,
    );
    if (unitName) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.modalService
        .showUnitCreateEditModal(false, undefined, { name: unitName })
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
    this.unitRepo
      .searchUnits(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: UnitsPaginated) => {
        this.units.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  createUnit() {
    this.modalService
      .showUnitCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editUnit(unit: Unit) {
    this.unitRepo
      .retrieveUnit(unit.uid)
      .pipe(
        switchMap((retrievedUnit) =>
          this.modalService.showUnitCreateEditModal(true, retrievedUnit),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }

  archiveUnit(unit: Unit) {
    this.unitRepo
      .archiveUnit(unit.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(`Unit "${unit.name}" archived`);
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }
}
