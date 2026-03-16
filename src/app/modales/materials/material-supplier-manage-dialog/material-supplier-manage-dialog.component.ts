import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Button } from "primeng/button";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin } from "rxjs";
import { BaseModal } from "../../../models/classes/base-modal";
import { Icons } from "../../../models/enums/icons";
import { TableColsTitle } from "../../../models/enums/table-cols-title";
import {
  Currency,
  MaterialSupplier,
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
} from "../../../../client/costSeiko";
import { MaterialRepo } from "../../../repositories/material.repo";
import { CurrencyRepo } from "../../../repositories/currency.repo";
import { SupplierManufacturerRepo } from "../../../repositories/supplier-manufacturer.repo";
import { ModalService } from "../../../services/components/modal.service";
import { SearchInputComponent } from "../../../components/search-input/search-input.component";
import { NoDoubleClickDirective } from "../../../directives/no-double-click.directive";
import { Chip } from "primeng/chip";
import { Popover } from "primeng/popover";

@Component({
  selector: "app-material-supplier-manage-dialog",
  imports: [
    Button,
    TableModule,
    TooltipModule,
    SearchInputComponent,
    NoDoubleClickDirective,
    Chip,
    Popover,
  ],
  templateUrl: "./material-supplier-manage-dialog.component.html",
  styleUrl: "./material-supplier-manage-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialSupplierManageDialogComponent
  extends BaseModal
  implements OnInit
{
  suppliers = signal<MaterialSupplier[]>([]);
  loading = signal<boolean>(true);
  currencies = signal<Currency[]>([]);
  availableSuppliers = signal<SupplierAndManufacturer[]>([]);

  protected readonly Icons = Icons;
  protected readonly TableColsTitle = TableColsTitle;

  private materialRepo = inject(MaterialRepo);
  private currencyRepo = inject(CurrencyRepo);
  private supplierManufacturerRepo = inject(SupplierManufacturerRepo);
  private modalService = inject(ModalService);
  private materialUid!: string;

  ngOnInit(): void {
    this.materialUid = this.dataConfig.materialUid;
    this.loadResources();
    this.loadMaterialSuppliers();
  }

  loadMaterialSuppliers(search: string = ""): void {
    this.loading.set(false);
    this.materialRepo
      .searchMaterialSuppliers(this.materialUid, 0, 1000, search)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        this.suppliers.set(r.results);
        this.loading.set(false);
      });
  }

  addMaterialSupplier(): void {
    this.modalService
      .showMaterialSupplierFormModal(
        this.materialUid,
        null,
        this.currencies(),
        this.availableSuppliers(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.loadMaterialSuppliers();
      });
  }

  editMaterialSupplier(supplier: MaterialSupplier): void {
    this.modalService
      .showMaterialSupplierFormModal(
        this.materialUid,
        supplier,
        this.currencies(),
        this.availableSuppliers(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadMaterialSuppliers();
        }
      });
  }

  archiveMaterialSupplier(supplier: MaterialSupplier): void {
    this.materialRepo
      .archiveMaterialSupplier(this.materialUid, supplier.uid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Supplier archived successfully");
          this.loadMaterialSuppliers();
        },
      });
  }

  private loadResources(): void {
    forkJoin({
      currencies: this.currencyRepo.listAllCurrencies(),
      suppliers: this.supplierManufacturerRepo.listAllSupplierManufacturers(
        SupplierAndManufacturerType.SUPPLIER,
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ currencies, suppliers }) => {
        this.currencies.set(currencies);
        this.availableSuppliers.set(suppliers);
      });
  }
}
