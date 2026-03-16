import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { InputContainerComponent } from "../../../../components/input-container/input-container.component";
import { TooltipModule } from "primeng/tooltip";
import { BaseModal } from "../../../../models/classes/base-modal";
import { Icons } from "../../../../models/enums/icons";
import {
  Material,
  MaterialType,
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
  Unit,
} from "../../../../../client/costSeiko";
import { CostRequestLineMaterialFormField } from "../../../../models/enums/form-field-names/cost-request-form-field";
import { MaterialRepo } from "../../../../repositories/material.repo";
import { SupplierManufacturerRepo } from "../../../../repositories/supplier-manufacturer.repo";
import { MaterialCategoryRepo } from "../../../../repositories/material-category-repo.service";
import { UnitRepo } from "../../../../repositories/unit.repo";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Listbox } from "primeng/listbox";
import { Popover } from "primeng/popover";
import { InputText } from "primeng/inputtext";
import { NoDoubleClickDirective } from "../../../../directives/no-double-click.directive";

interface ExistingEntry {
  manufacturerUid: string;
  partNumber: string;
}

type AdminLookupStatus =
  | "idle"
  | "loading"
  | "found"
  | "missing"
  | "requires-manufacturer";

interface AdminLookupState {
  status: AdminLookupStatus;
  message: string;
}

interface ManufacturerPartNumberLookupResult {
  exists: boolean;
  requiresManufacturer: boolean;
  waitForManufacturer: boolean;
}

@Component({
  selector: "app-material-line-form-dialog",
  imports: [
    ReactiveFormsModule,
    FormsModule,
    Button,
    InputContainerComponent,
    TooltipModule,
    IconField,
    InputIcon,
    Listbox,
    Popover,
    InputText,
    NoDoubleClickDirective,
  ],
  templateUrl: "./material-line-form-dialog.component.html",
  styleUrl: "./material-line-form-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialLineFormDialogComponent
  extends BaseModal
  implements OnInit, AfterViewInit
{
  @ViewChild("manufacturerPNPopover") manufacturerPNPopover!: Popover;
  @ViewChild("manufacturerPopover") manufacturerPopover!: Popover;
  @ViewChild("categoryPopover") categoryPopover!: Popover;
  @ViewChild("unitPopover") unitPopover!: Popover;

  form!: FormGroup;
  isEditMode = signal<boolean>(false);
  manufacturerPNSuggestions = signal<Material[]>([]);
  manufacturerPNMessage = signal<string>("");
  manufacturerPNMessageSeverity = signal<"warn" | "info">("info");
  selectedManufacturerPN = signal<Material | null>(null);
  selectedManufacturer = signal<SupplierAndManufacturer | null>(null);
  manufacturerInput = signal<string>("");
  manufacturersLoading = signal<boolean>(false);
  manufacturersLoadedOnce = signal<boolean>(false);
  manufacturers = signal<SupplierAndManufacturer[]>([]);
  materialCategories = signal<{ uid: string; name: string }[]>([]);
  units = signal<Unit[]>([]);
  manufacturerAdminState = signal<AdminLookupState>({
    status: "idle",
    message: "",
  });
  manufacturerPartNumberAdminState = signal<AdminLookupState>({
    status: "idle",
    message: "",
  });
  categoryAdminState = signal<AdminLookupState>({
    status: "idle",
    message: "",
  });
  unitAdminState = signal<AdminLookupState>({
    status: "idle",
    message: "",
  });
  protected readonly Icons = Icons;
  protected readonly CostRequestLineMaterialFormField =
    CostRequestLineMaterialFormField;
  private materialType!: MaterialType;
  private existingEntries: ExistingEntry[] = [];
  private manufacturerPartNumberCheck$ = new Subject<void>();
  private materialRepo = inject(MaterialRepo);
  private supplierManufacturerRepo = inject(SupplierManufacturerRepo);
  private materialCategoryRepo = inject(MaterialCategoryRepo);
  private unitRepo = inject(UnitRepo);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const data = this.dataConfig;
    this.materialType = data.materialType ?? MaterialType.DIRECT;
    this.existingEntries = data.existingEntries ?? [];
    this.isEditMode.set(!!data.initialValues);

    this.form = this.formService.buildCostRequestLineMaterialForm();
    this.form
      .get(CostRequestLineMaterialFormField.MATERIAL_TYPE)
      ?.setValue(this.materialType, { emitEvent: false });

    if (data.initialValues) {
      this.form.patchValue(data.initialValues, { emitEvent: false });
      this.form
        .get(CostRequestLineMaterialFormField.MATERIAL_TYPE)
        ?.setValue(this.materialType, { emitEvent: false });
      this.selectedManufacturer.set(data.initialManufacturer ?? null);
    }
    this.manufacturerInput.set(
      this.form.get(CostRequestLineMaterialFormField.MANUFACTURER)?.value ?? "",
    );
    this.form
      .get(CostRequestLineMaterialFormField.MATERIAL_TYPE)
      ?.disable({ emitEvent: false });
    this.initAdminLookupChecks();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.loadCategoriesAndUnits(), 200);
  }

  confirm(): void {
    this.formService.trimFormStringValues(this.form);
    this.form.disable({ emitEvent: false });
    this.closeDialog(this.form);
  }

  cancel(): void {
    this.closeDialog(null);
  }

  showManufacturerList(event: Event): void {
    if (!this.manufacturersLoadedOnce()) {
      this.loadManufacturers();
    }
    this.manufacturerPopover.toggle(event);
  }

  selectManufacturer(manufacturer: SupplierAndManufacturer): void {
    this.selectedManufacturer.set(manufacturer);
    this.selectedManufacturerPN.set(null);
    this.manufacturerInput.set(manufacturer.name ?? "");
    this.form
      .get(CostRequestLineMaterialFormField.MANUFACTURER)
      ?.setValue(manufacturer.name, { emitEvent: false });
    this.setAdminLookupState(this.manufacturerAdminState, "found");
    this.manufacturerPopover.hide();
    this.triggerManufacturerPartNumberCheck();
    this.enableFieldsAfterManufacturer();
  }

  onManufacturerInput(): void {
    const text = (
      this.form.get(CostRequestLineMaterialFormField.MANUFACTURER)?.value ?? ""
    ).trim();
    this.manufacturerInput.set(text);
    if (this.selectedManufacturer()) {
      this.selectedManufacturer.set(null);
    }
    this.selectedManufacturerPN.set(null);
    this.form
      .get(CostRequestLineMaterialFormField.MATERIAL_EXISTS)
      ?.setValue(false, { emitEvent: false });
    if (text) {
      this.enableFieldsAfterManufacturer();
    }
    this.triggerManufacturerPartNumberCheck();
  }

  onManufacturerBlur(): void {
    const text = (
      this.form.get(CostRequestLineMaterialFormField.MANUFACTURER)?.value ?? ""
    ).trim();
    this.manufacturerInput.set(text);
    if (!text || this.selectedManufacturer()) return;
    const match = this.manufacturers().find(
      (m) => m.name?.toLowerCase() === text.toLowerCase(),
    );
    if (match) {
      this.selectedManufacturer.set(match);
    }
  }

  showManufacturerPN(event: Event): void {
    const selectedMfr = this.selectedManufacturer();
    if (!selectedMfr?.uid) {
      this.manufacturerPNSuggestions.set([]);
      this.manufacturerPNMessage.set("Please select a manufacturer first");
      this.manufacturerPNMessageSeverity.set("warn");
      this.manufacturerPNPopover.toggle(event);
      return;
    }
    this.materialRepo
      .autoCompleteMaterial({
        manufacturerId: selectedMfr.uid,
        manufacturerPartNumber: "",
        materialType: this.materialType,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((materials) => {
        if (!materials || materials.length === 0) {
          this.manufacturerPNSuggestions.set([]);
          this.manufacturerPNMessage.set("No part found for this manufacturer");
          this.manufacturerPNMessageSeverity.set("info");
        } else {
          this.manufacturerPNMessage.set("");
          this.manufacturerPNSuggestions.set(materials);
        }
        this.manufacturerPNPopover.toggle(event);
        this.cdr.detectChanges();
      });
  }

  selectManufacturerPN(material: Material): void {
    this.selectedManufacturerPN.set(material);
    this.setAdminLookupState(this.manufacturerPartNumberAdminState, "found");
    this.onMaterialSelect({ value: material });
    this.manufacturerPNPopover.hide();
  }

  onMaterialFocus(): void {
    const selectedMfr = this.selectedManufacturer();
    if (!selectedMfr?.uid) return;
    this.materialRepo
      .autoCompleteMaterial({
        manufacturerId: selectedMfr.uid,
        manufacturerPartNumber: "",
        materialType: this.materialType,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((materials) => {
        this.manufacturerPNSuggestions.set(materials);
        this.cdr.detectChanges();
      });
  }

  onMaterialSelect(event: any): void {
    const material: Material = event.value;

    const isDuplicate = this.existingEntries.some(
      (e) =>
        e.manufacturerUid === material.manufacturer?.uid &&
        e.partNumber === material.manufacturerPartNumber?.toLowerCase(),
    );

    if (isDuplicate) {
      this.handleMessage.warningMessage(
        `Material "${material.manufacturer?.name} - ${material.manufacturerPartNumber}" is already added`,
      );
      return;
    }

    this.form.patchValue({
      [CostRequestLineMaterialFormField.MATERIAL_EXISTS]: true,
      [CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER]:
        material.manufacturerPartNumber || "",
      [CostRequestLineMaterialFormField.DESCRIPTION]:
        material.description || "",
      [CostRequestLineMaterialFormField.CATEGORY]:
        material.category?.name || "",
      [CostRequestLineMaterialFormField.UNIT]: material.unit || "",
      [CostRequestLineMaterialFormField.MATERIAL_TYPE]: this.materialType,
    });
    this.selectedManufacturer.set(material.manufacturer ?? null);
    this.setAdminLookupState(this.manufacturerAdminState, "found");
    this.setAdminLookupState(this.manufacturerPartNumberAdminState, "found");
    if (material.category) {
      this.setAdminLookupState(this.categoryAdminState, "found");
    } else {
      this.setAdminLookupState(this.categoryAdminState, "idle");
    }
    if (material.unit && material.unit.trim().length > 0) {
      this.setAdminLookupState(this.unitAdminState, "found");
    } else {
      this.setAdminLookupState(this.unitAdminState, "idle");
    }
  }

  onManufacturerPartNumberInput(): void {
    this.selectedManufacturerPN.set(null);
    this.form
      .get(CostRequestLineMaterialFormField.MATERIAL_EXISTS)
      ?.setValue(false, { emitEvent: false });
    this.triggerManufacturerPartNumberCheck();
  }

  onManufacturerPartNumberBlur(): void {
    const selectedMfr = this.selectedManufacturer();
    const partNumber = this.form
      .get(CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER)
      ?.getRawValue()
      ?.trim();

    if (!selectedMfr?.uid || !partNumber) return;
    if (this.form.get(CostRequestLineMaterialFormField.MATERIAL_EXISTS)?.value)
      return;

    const cached = this.manufacturerPNSuggestions();
    const exact = cached.find(
      (m) =>
        m.manufacturerPartNumber?.toLowerCase() === partNumber.toLowerCase(),
    );
    if (exact) {
      this.onMaterialSelect({ value: exact });
      return;
    }
    if (cached.length === 0) {
      this.materialRepo
        .autoCompleteMaterial({
          manufacturerId: selectedMfr.uid,
          manufacturerPartNumber: partNumber,
          materialType: this.materialType,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((materials) => {
          const match = materials.find(
            (m) =>
              m.manufacturerPartNumber?.toLowerCase() ===
              partNumber.toLowerCase(),
          );
          if (match) this.onMaterialSelect({ value: match });
        });
    }
  }

  showCategoryList(event: Event): void {
    this.categoryPopover.toggle(event);
  }

  selectCategory(category: { uid: string; name: string }): void {
    this.form
      .get(CostRequestLineMaterialFormField.CATEGORY)
      ?.setValue(category.name, { emitEvent: false });
    this.setAdminLookupState(this.categoryAdminState, "found");
    this.categoryPopover.hide();
  }

  showUnitList(event: Event): void {
    this.unitPopover.toggle(event);
  }

  selectUnit(unit: Unit): void {
    this.form.get(CostRequestLineMaterialFormField.UNIT)?.setValue(unit.name);
    this.setAdminLookupState(this.unitAdminState, "found");
    this.unitPopover.hide();
  }

  private loadCategoriesAndUnits(): void {
    forkJoin({
      categories: this.materialCategoryRepo.listAllMaterialCategories(),
      units: this.unitRepo.listAllUnits(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ categories, units }) => {
        this.materialCategories.set(
          categories as { uid: string; name: string }[],
        );
        this.units.set(units);
      });
  }

  private initAdminLookupChecks(): void {
    this.observeManufacturerAdminState();
    this.observeManufacturerPartNumberAdminState();
    this.observeCategoryAdminState();
    this.observeUnitAdminState();
  }

  private observeManufacturerAdminState(): void {
    const manufacturerCtrl = this.form.get(
      CostRequestLineMaterialFormField.MANUFACTURER,
    );

    manufacturerCtrl?.valueChanges
      .pipe(
        startWith(manufacturerCtrl.getRawValue() ?? ""),
        map((value) => (value ?? "").trim()),
        distinctUntilChanged(),
        tap((value) => {
          if (!value) {
            this.selectedManufacturer.set(null);
            this.setAdminLookupState(this.manufacturerAdminState, "idle");
            this.triggerManufacturerPartNumberCheck();
            return;
          }
          this.setAdminLookupState(this.manufacturerAdminState, "loading");
        }),
        debounceTime(500),
        switchMap((value) => {
          if (!value) {
            return of<string | null>(null);
          }
          return this.supplierManufacturerRepo
            .existSupplierManufacturerByName(value)
            .pipe(catchError(() => of<string | null>(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((manufacturerUid) => {
        const value = manufacturerCtrl.getRawValue()?.trim() ?? "";
        if (manufacturerUid) {
          this.selectedManufacturer.set({
            uid: manufacturerUid,
            name: value,
            code: "",
            type: SupplierAndManufacturerType.MANUFACTURER,
          });
          this.setAdminLookupState(this.manufacturerAdminState, "found");
        } else {
          this.selectedManufacturer.set(null);
          const hasValue = !!value;
          this.setAdminLookupState(
            this.manufacturerAdminState,
            hasValue ? "missing" : "idle",
          );
        }
        this.triggerManufacturerPartNumberCheck();
      });
  }

  private observeManufacturerPartNumberAdminState(): void {
    this.manufacturerPartNumberCheck$
      .pipe(
        tap(() => {
          // Update the UI immediately on each trigger so the user sees either:
          // - nothing when the field is empty
          // - a dependency hint when no manufacturer is provided
          // - a loading state while the validation pipeline is running
          const partNumber = this.getTrimmedControlValue(
            CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER,
          );
          const manufacturerText = this.getTrimmedControlValue(
            CostRequestLineMaterialFormField.MANUFACTURER,
          );
          if (!partNumber) {
            this.setAdminLookupState(
              this.manufacturerPartNumberAdminState,
              "idle",
            );
            return;
          }
          if (!manufacturerText) {
            this.setAdminLookupState(
              this.manufacturerPartNumberAdminState,
              "requires-manufacturer",
            );
            return;
          }
          this.setAdminLookupState(
            this.manufacturerPartNumberAdminState,
            "loading",
          );
        }),
        debounceTime(500),
        switchMap(() => {
          // After the debounce window, decide whether we can validate the P/N now
          // or whether we must wait for the manufacturer lookup to settle first.
          const partNumber = this.getTrimmedControlValue(
            CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER,
          );
          const manufacturerText = this.getTrimmedControlValue(
            CostRequestLineMaterialFormField.MANUFACTURER,
          );
          if (!partNumber) {
            return of<ManufacturerPartNumberLookupResult>({
              exists: false,
              requiresManufacturer: false,
              waitForManufacturer: false,
            });
          }
          if (!manufacturerText) {
            return of<ManufacturerPartNumberLookupResult>({
              exists: false,
              requiresManufacturer: true,
              waitForManufacturer: false,
            });
          }
          if (
            this.manufacturerAdminState().status === "loading" &&
            !this.selectedManufacturer()?.uid
          ) {
            return of<ManufacturerPartNumberLookupResult>({
              exists: false,
              requiresManufacturer: false,
              waitForManufacturer: true,
            });
          }
          if (!this.selectedManufacturer()?.uid) {
            return of<ManufacturerPartNumberLookupResult>({
              exists: false,
              requiresManufacturer: false,
              waitForManufacturer: false,
            });
          }
          const selectedManufacturerUid = this.selectedManufacturer()?.uid;
          if (!selectedManufacturerUid) {
            return of<ManufacturerPartNumberLookupResult>({
              exists: false,
              requiresManufacturer: true,
              waitForManufacturer: false,
            });
          }
          return this.materialRepo
            .autoCompleteMaterial({
              manufacturerId: selectedManufacturerUid,
              manufacturerPartNumber: partNumber,
              materialType: this.materialType,
            })
            .pipe(
              map((materials) => {
                const exists = materials.some(
                  (material) =>
                    material.manufacturerPartNumber?.trim().toLowerCase() ===
                    partNumber.toLowerCase(),
                );
                return {
                  exists,
                  requiresManufacturer: false,
                  waitForManufacturer: false,
                };
              }),
              catchError(() =>
                of<ManufacturerPartNumberLookupResult>({
                  exists: false,
                  requiresManufacturer: false,
                  waitForManufacturer: false,
                }),
              ),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ exists, requiresManufacturer, waitForManufacturer }) => {
        // Final state reduction: we only mark the P/N as missing once the
        // manufacturer state is stable enough to make that conclusion.
        const hasValue = !!this.getTrimmedControlValue(
          CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER,
        );
        if (hasValue && requiresManufacturer) {
          this.setAdminLookupState(
            this.manufacturerPartNumberAdminState,
            "requires-manufacturer",
          );
          return;
        }
        if (hasValue && waitForManufacturer) {
          this.setAdminLookupState(
            this.manufacturerPartNumberAdminState,
            "loading",
          );
          return;
        }
        this.setAdminLookupState(
          this.manufacturerPartNumberAdminState,
          hasValue ? (exists ? "found" : "missing") : "idle",
        );
      });

    this.form
      .get(CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER)
      ?.valueChanges.pipe(
        startWith(
          this.form
            .get(CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER)
            ?.getRawValue() ?? "",
        ),
        map((value) => (value ?? "").trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      // Any P/N edit restarts the debounced validation flow above.
      .subscribe(() => this.triggerManufacturerPartNumberCheck());
  }

  private observeCategoryAdminState(): void {
    const categoryCtrl = this.form.get(
      CostRequestLineMaterialFormField.CATEGORY,
    );

    categoryCtrl?.valueChanges
      .pipe(
        startWith(categoryCtrl.getRawValue() ?? ""),
        map((value) => (value ?? "").trim()),
        distinctUntilChanged(),
        tap((value) => {
          this.setAdminLookupState(
            this.categoryAdminState,
            value ? "loading" : "idle",
          );
        }),
        debounceTime(500),
        switchMap((value) => {
          if (!value) {
            return of<string | null>(null);
          }
          return this.materialCategoryRepo
            .existMaterialCategoryByName(value)
            .pipe(catchError(() => of<string | null>(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((categoryUid) => {
        const hasValue = !!categoryCtrl.getRawValue()?.trim();
        this.setAdminLookupState(
          this.categoryAdminState,
          hasValue ? (categoryUid ? "found" : "missing") : "idle",
        );
      });
  }

  private observeUnitAdminState(): void {
    const unitCtrl = this.form.get(CostRequestLineMaterialFormField.UNIT);

    unitCtrl?.valueChanges
      .pipe(
        startWith(unitCtrl.getRawValue() ?? ""),
        map((value) => (value ?? "").trim()),
        distinctUntilChanged(),
        tap((value) => {
          this.setAdminLookupState(
            this.unitAdminState,
            value ? "loading" : "idle",
          );
        }),
        debounceTime(500),
        switchMap((value) => {
          if (!value) {
            return of<string | null>(null);
          }
          return this.unitRepo
            .existUnitByName(value)
            .pipe(catchError(() => of<string | null>(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((unitUid) => {
        const hasValue = !!unitCtrl.getRawValue()?.trim();
        this.setAdminLookupState(
          this.unitAdminState,
          hasValue ? (unitUid ? "found" : "missing") : "idle",
        );
      });
  }

  private loadManufacturers(): void {
    this.manufacturersLoading.set(true);
    this.supplierManufacturerRepo
      .listAllSupplierManufacturers(SupplierAndManufacturerType.MANUFACTURER)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.manufacturersLoading.set(false);
          this.manufacturersLoadedOnce.set(true);
        }),
      )
      .subscribe((manufacturers) => {
        this.manufacturers.set(manufacturers);
      });
  }

  private enableFieldsAfterManufacturer(): void {
    const isExisting = this.form.get(
      CostRequestLineMaterialFormField.MATERIAL_EXISTS,
    )?.value;
    if (isExisting) return;
    [
      CostRequestLineMaterialFormField.MANUFACTURER_PART_NUMBER,
      CostRequestLineMaterialFormField.DESCRIPTION,
      CostRequestLineMaterialFormField.CATEGORY,
      CostRequestLineMaterialFormField.UNIT,
    ].forEach((k) => this.form.get(k)?.enable({ emitEvent: false }));
  }

  private triggerManufacturerPartNumberCheck(): void {
    this.manufacturerPartNumberCheck$.next();
  }

  private setAdminLookupState(
    stateSignal: {
      set: (value: AdminLookupState) => void;
    },
    status: AdminLookupStatus,
  ): void {
    const messages: Record<Exclude<AdminLookupStatus, "idle">, string> = {
      loading: "Searching in admin...",
      found: "Exists in admin",
      missing: "Does not exist in admin",
      "requires-manufacturer":
        "Select a manufacturer to check whether this P/N exists in admin",
    };

    stateSignal.set({
      status,
      message: status === "idle" ? "" : messages[status],
    });
  }

  private getTrimmedControlValue(
    controlName: CostRequestLineMaterialFormField,
  ): string {
    return this.form.get(controlName)?.getRawValue()?.toString().trim() ?? "";
  }
}
