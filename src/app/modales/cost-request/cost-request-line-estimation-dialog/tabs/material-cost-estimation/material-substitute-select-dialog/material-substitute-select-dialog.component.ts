import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject, switchMap } from "rxjs";
import { Button } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { InputNumber } from "primeng/inputnumber";
import { Chip } from "primeng/chip";
import { BaseModal } from "../../../../../../models/classes/base-modal";
import { Icons } from "../../../../../../models/enums/icons";
import { Material } from "../../../../../../../client/costSeiko";
import { MaterialRepo } from "../../../../../../repositories/material.repo";
import { MaterialTypePipe } from "../../../../../../pipes/material-type.pipe";

@Component({
  selector: "app-material-substitute-select-dialog",
  imports: [
    Button,
    IconField,
    InputIcon,
    InputText,
    InputNumber,
    FormsModule,
    Chip,
    MaterialTypePipe,
  ],
  templateUrl: "./material-substitute-select-dialog.component.html",
  styleUrl: "./material-substitute-select-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialSubstituteSelectDialogComponent extends BaseModal {
  searchText = signal<string>("");
  results = signal<Material[]>([]);
  selectedMaterial = signal<Material | null>(null);
  quantity = signal<number | null>(null);
  searching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  canConfirm = computed(
    () => !!this.selectedMaterial() && (this.quantity() ?? 0) > 0,
  );

  protected readonly Icons = Icons;

  private materialRepo = inject(MaterialRepo);
  private search$ = new Subject<string>();

  constructor() {
    super();
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((text) => {
          this.searching.set(true);
          this.hasSearched.set(true);
          return this.materialRepo.searchMaterials(0, 20, text);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (paginated) => {
          this.results.set(paginated.results ?? []);
          this.searching.set(false);
        },
        error: () => {
          this.results.set([]);
          this.searching.set(false);
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
    this.selectedMaterial.set(null);
    if (value.trim().length >= 2) {
      this.search$.next(value.trim());
    } else {
      this.results.set([]);
      this.hasSearched.set(false);
    }
  }

  selectMaterial(material: Material): void {
    this.selectedMaterial.set(material);
    this.results.set([]);
    this.searchText.set(
      `${material.manufacturer.name ?? material.draftManufacturerName ?? ""} — ${material.manufacturerPartNumber}`,
    );
  }

  clearSelection(): void {
    this.selectedMaterial.set(null);
    this.quantity.set(null);
    this.searchText.set("");
    this.results.set([]);
    this.hasSearched.set(false);
  }

  confirm(): void {
    const material = this.selectedMaterial();
    const qty = this.quantity();
    if (material && qty && qty > 0) {
      this.closeDialog({ materialSubstituteId: material.uid, quantity: qty });
    }
  }
}
