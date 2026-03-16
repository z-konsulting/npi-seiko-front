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
import {
  MaterialCategoriesPaginated,
  MaterialCategory,
} from "../../../../client/costSeiko";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { FormsModule } from "@angular/forms";
import { BaseListComponent } from "../../../models/classes/base-list-component";
import { switchMap } from "rxjs";
import { MaterialCategoryRepo } from "../../../repositories/material-category-repo.service";
import { AuthenticationService } from "../../../security/authentication.service";
import { AccessService } from "../../../services/Access.service";
import { QueryParamKey } from "../../../models/enums/queryParamKey";

@Component({
  selector: "app-admin-material-categories",
  imports: [
    CardModule,
    PrimeTemplate,
    Button,
    SearchInputComponent,
    TableModule,
    TooltipModule,
    CustomTitleComponent,
    NoDoubleClickDirective,
    FormsModule,
  ],
  templateUrl: "./admin-material-categories.component.html",
  styleUrl: "./admin-material-categories.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMaterialCategoriesComponent
  extends BaseListComponent
  implements OnInit
{
  materialCategories = signal<MaterialCategory[]>([]);

  protected readonly TableColsTitle = TableColsTitle;
  protected readonly Icons = Icons;

  private materialCategoryRepo = inject(MaterialCategoryRepo);
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
      RouteId.ADMIN_MATERIAL_CATEGORIES,
    );
  }

  ngOnInit() {
    this.loading = true;
    const categoryName = this.activatedRoute.snapshot.queryParamMap.get(
      QueryParamKey.CATEGORY_NAME,
    );
    if (categoryName) {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      this.modalService
        .showMaterialCategoryCreateEditModal(false, undefined, {
          name: categoryName,
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
    this.materialCategoryRepo
      .searchMaterialCategories(event.first, event.rows, this.searchText)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results: MaterialCategoriesPaginated) => {
        this.materialCategories.set(results.results);
        this.totalRecords = results.total;
        this.loading = false;
      });
  }

  archiveMaterialCategory(materialCategory: MaterialCategory) {
    this.materialCategoryRepo
      .archiveMaterialCategory(materialCategory.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage(
            `Material category ${materialCategory.name} archived`,
          );
          this.loadData(this.lastTableLazyLoadEvent);
        },
      });
  }

  createMaterialCategory() {
    this.modalService
      .showMaterialCategoryCreateEditModal(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created?: boolean) => {
        if (created) {
          this.loadData(this.lastTableLazyLoadEvent);
        }
      });
  }

  editMaterialCategory(materialCategory: MaterialCategory) {
    this.materialCategoryRepo
      .getMaterialCategory(materialCategory.uid)
      .pipe(
        switchMap((mat) =>
          this.modalService.showMaterialCategoryCreateEditModal(true, mat),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadData(this.lastTableLazyLoadEvent);
      });
  }
}
