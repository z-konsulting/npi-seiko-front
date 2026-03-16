import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";
import { Select } from "primeng/select";
import { SelectButton } from "primeng/selectbutton";
import { Chip } from "primeng/chip";
import { Tooltip } from "primeng/tooltip";
import { Button } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { Icons } from "../../../../models/enums/icons";
import { CurrencyRepo } from "../../../../repositories/currency.repo";
import { NumberFormatterService } from "../../../../services/utils/number-formatter.service";
import { HandleToastMessageService } from "../../../../services/handle-toast-message.service";
import {
  CostingMethodType,
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
  Currency,
  EstimationDetailsPerQuantity,
  EstimationDetailsPerShipmentToCustomer,
  EstimationDetailsPerToolingStrategy,
  GlobalConfig,
  MarkupApprovalStrategy,
  ToolingStrategy,
} from "../../../../../client/costSeiko";
import { CostRequestLineRepo } from "../../../../repositories/cost-request-line.repo";
import { GlobalConfigRepo } from "../../../../repositories/global-config.repo";

interface CostCategory {
  key: keyof Pick<
    EstimationDetailsPerQuantity,
    | "totalProcessCostInTargetCurrencyWithAdditional"
    | "totalMaterialCostInTargetCurrencyWithYield"
    | "totalToolingCostInTargetCurrency"
    | "totalOtherCostInTargetCurrency"
  >;
  label: "Process" | "Materials" | "Tooling" | "Other" | "Total";
  icon: string;
  colorClass: string;
}

@Component({
  selector: "app-cost-breakdown-view",
  imports: [
    DecimalPipe,
    FormsModule,
    Select,
    SelectButton,
    Chip,
    Tooltip,
    Button,
    InputNumberModule,
    NgTemplateOutlet,
  ],
  templateUrl: "./cost-breakdown-view.component.html",
  styleUrl: "./cost-breakdown-view.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DecimalPipe],
})
export class CostBreakdownViewComponent implements OnInit {
  costRequest = input.required<CostRequest>();
  line = input.required<CostRequestLine>();
  globalConfig = input.required<GlobalConfig>();
  hasCustomerShipmentLocation = input.required<boolean>();

  isOutsourced = computed<boolean>(() => this.line()?.outsourced === true);

  // Raw data from the API — indexed by tooling strategy entry
  estimationDataPerShipment = signal<EstimationDetailsPerShipmentToCustomer[]>(
    [],
  );
  estimationData = signal<EstimationDetailsPerToolingStrategy[]>([]);
  // Tooling section: SEPARATED entry (only present when strategy is SEPARATED)
  toolingEstimationDetails = computed<EstimationDetailsPerQuantity[]>(() => {
    const entry = this.estimationData().find(
      (e) => e.toolingStrategy === ToolingStrategy.SEPARATED,
    );
    return entry?.estimationDetailsPerQuantity ?? [];
  });
  toolingStrategy = signal<ToolingStrategy>(ToolingStrategy.AMORTIZED);
  // Main section: AMORTIZED entry (always present)
  mainEstimationDetails = computed<EstimationDetailsPerQuantity[]>(() => {
    const entry = this.estimationData().find(
      (e) => e.toolingStrategy === this.toolingStrategy(),
    );
    return entry?.estimationDetailsPerQuantity ?? [];
  });
  isSeparated = computed(
    () => this.toolingStrategy() === ToolingStrategy.SEPARATED,
  );
  isNPI = computed(
    () => this.line().costingMethodType === CostingMethodType.NPI,
  );

  markup = signal<number | null>(null);
  toolingMarkup = signal<number | null>(null);

  isMarkupUpdatable = computed(
    () =>
      this.line().status === CostRequestStatus.READY_FOR_MARKUP ||
      this.line().status === CostRequestStatus.PRICE_REJECTED,
  );
  hasMarkup = computed(() =>
    this.mainEstimationDetails().some(
      (d) => d.totalCostWithMarkupInTargetCurrency != null,
    ),
  );
  hasToolingMarkup = computed(() =>
    this.toolingEstimationDetails().some(
      (d) => d.totalToolingCostWithMarkupInTargetCurrency != null,
    ),
  );
  approvalRange = computed<{ lower: number; upper: number } | null>(() => {
    const config = this.globalConfig();
    if (
      !config ||
      config.markupApprovalStrategy !==
        MarkupApprovalStrategy.BASED_ON_CUSTOM_RULES
    )
      return null;
    const base = config.baseMarkup;
    const range = config.markupRange;
    if (base == null || range == null) return null;
    return {
      lower: Math.max(0, base - range),
      upper: Math.min(100, base + range),
    };
  });
  markupApprovalStatus = computed(() =>
    this.computeMarkupApprovalStatus(this.markup()),
  );
  toolingMarkupApprovalStatus = computed(() =>
    this.computeMarkupApprovalStatus(this.toolingMarkup()),
  );
  loading = signal<boolean>(false);
  currencies = signal<Currency[]>([]);
  selectedCurrencyCode = signal<string | null>(null);
  // Stores a location+currency key to survive object reference changes across API reloads
  selectedLocation = signal<string | null>(null);
  targetCurrencyCode = signal<string | null>(null);
  currencyOptions = computed(() =>
    this.currencies().map((c) => ({ label: c.code, value: c.code })),
  );
  locationsOptions = computed(() =>
    this.estimationDataPerShipment().map((e) => ({
      label: e.locationName,
      value: this.buildLocationKey(e.locationName, e.currency.code),
      currencyCode: e.currency.code,
    })),
  );
  selectedExchangeRate = computed<number | null>(() => {
    const targetCode = this.targetCurrencyCode();
    const selectedCode = this.selectedCurrencyCode();
    if (!targetCode || !selectedCode || targetCode === selectedCode)
      return null;
    const targetCurrency = this.currencies().find((c) => c.code === targetCode);
    if (!targetCurrency) return null;
    return (
      targetCurrency.exchangeRates.find(
        (r) => r.toCurrencyCode === selectedCode,
      )?.rate ?? null
    );
  });
  withLoadingDelay = signal<boolean>(false);
  categories = computed<CostCategory[]>(() => {
    const base: CostCategory[] = [
      {
        key: "totalProcessCostInTargetCurrencyWithAdditional",
        label: "Process",
        icon: Icons.COG,
        colorClass: "cat-process",
      },
      {
        key: "totalMaterialCostInTargetCurrencyWithYield",
        label: "Materials",
        icon: Icons.CUBE,
        colorClass: "cat-material",
      },
    ];

    // In AMORTIZED mode (or non-NPI): include tooling in the main categories
    if (!this.isSeparated()) {
      const methodType = this.line().costingMethodType;
      if (methodType !== CostingMethodType.HV) {
        base.push({
          key: "totalToolingCostInTargetCurrency",
          label: "Tooling",
          icon: Icons.WRENCH,
          colorClass: "cat-tooling",
        });
      }
    }

    base.push({
      key: "totalOtherCostInTargetCurrency",
      label: "Other",
      icon: Icons.ELLIPSIS,
      colorClass: "cat-other",
    });

    return base;
  });
  breakdownQuantities = computed<number[]>(() =>
    this.mainEstimationDetails()
      .map((d) => d.quantity)
      .sort((a, b) => a - b),
  );
  bestUnitCostQuantity = computed<number | null>(() => {
    const quantities = this.breakdownQuantities();
    if (quantities.length === 0) return null;
    let bestQty = 0;
    let bestUnitCost = Infinity;
    for (const qty of quantities) {
      if (qty === 0) continue;
      const unitCost = NumberFormatterService.formatToTwoDecimalPlaces(
        this.getBreakdownTotal(qty) / qty,
      );
      if (
        unitCost > 0 &&
        (unitCost < bestUnitCost ||
          (unitCost === bestUnitCost && qty > bestQty))
      ) {
        bestUnitCost = unitCost;
        bestQty = qty;
      }
    }
    return bestQty;
  });
  toolingStrategyOptions = [
    { label: "Amortized", value: ToolingStrategy.AMORTIZED },
    { label: "Separated", value: ToolingStrategy.SEPARATED },
  ];
  protected readonly Icons = Icons;
  protected readonly CostRequestStatus = CostRequestStatus;
  protected readonly ToolingStrategy = ToolingStrategy;
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private currencyRepo = inject(CurrencyRepo);
  private destroyRef = inject(DestroyRef);
  private globalConfigRepo = inject(GlobalConfigRepo);
  private handleMessage = inject(HandleToastMessageService);
  private decimalPipe = inject(DecimalPipe);
  additionalRateForOneQty = computed(() => {
    const methodType = this.line().costingMethodType;
    if (methodType === CostingMethodType.HV) return null;
    return this.decimalPipe.transform(
      this.getProcessAdditionalRate(1),
      "1.2-4",
    );
  });
  yieldRate = computed(() => {
    return this.decimalPipe.transform(this.getProcessYieldRate(1), "1.2-4");
  });

  ngOnInit(): void {
    this.toolingStrategy.set(this.line().toolingStrategy);

    const existingLineMarkup = this.line().markup;
    if (existingLineMarkup != null) {
      this.markup.set(existingLineMarkup);
    } else {
      const customerMarkup = this.costRequest().customer?.markup;
      if (customerMarkup != null) {
        this.markup.set(customerMarkup);
      }
    }

    const existingToolingMarkup = this.line().toolingMarkup;
    if (existingToolingMarkup != null) {
      this.toolingMarkup.set(existingToolingMarkup);
    } else {
      const customerMarkup = this.costRequest().customer?.markup;
      if (customerMarkup != null) {
        this.toolingMarkup.set(customerMarkup);
      }
    }

    this.loadCurrencies();
    this.loadTargetCurrency();
  }

  onCurrencyChange(code: string): void {
    this.selectedCurrencyCode.set(code);
    this.withLoadingDelay.set(true);
    this.loadEstimationDetails();
  }

  onLocationChange(locationKey: string): void {
    const location = this.estimationDataPerShipment().find(
      (e) =>
        this.buildLocationKey(e.locationName, e.currency.code) === locationKey,
    );
    if (!location) return;
    this.selectedLocation.set(locationKey);
    this.selectedCurrencyCode.set(location.currency.code);
    this.withLoadingDelay.set(true);
    this.loadEstimationDetails();
  }

  onToolingStrategyChange(strategy: ToolingStrategy): void {
    this.withLoadingDelay.set(true);
    this.costRequestLineRepo
      .setToolingStrategy(this.costRequest().uid, this.line().uid, strategy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toolingStrategy.set(strategy);
          this.loadEstimationDetails();
        },
      });
  }

  // ============================================
  // MAIN BREAKDOWN HELPERS
  // ============================================

  getBreakdownAmount(
    categoryKey: CostCategory["key"],
    quantity: number,
  ): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail ? (detail[categoryKey] as number) : 0;
  }

  getBreakdownMaterialShippingCost(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail ? detail.totalMaterialShippingCostInTargetCurrency : 0;
  }

  getProcessBaseAmount(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail
      ? detail.totalProcessCostInTargetCurrencyWithoutAdditional
      : 0;
  }

  getProcessAdditionalRate(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail ? detail.additionalProcessCostAppliedRate : 0;
  }

  getProcessYieldRate(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail ? detail.yieldApplied : 0;
  }

  getBreakdownTotal(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    if (!detail) return 0;
    // totalCostInTargetCurrency already reflects the tooling strategy:
    // SEPARATED → excludes tooling, AMORTIZED → includes tooling
    return detail.totalCostInTargetCurrency;
  }

  getBreakdownUnitCost(quantity: number): number {
    if (quantity === 0) return 0;
    return this.getBreakdownTotal(quantity) / quantity;
  }

  getBreakdownUnitPrice(quantity: number): number {
    if (quantity === 0) return 0;
    return this.getBreakdownTotalWithMarkup(quantity) / quantity;
  }

  getBreakdownTotalWithMarkup(quantity: number): number {
    const detail = this.mainEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail?.totalCostWithMarkupInTargetCurrency ?? 0;
  }

  // ============================================
  // TOOLING SECTION HELPERS (SEPARATED mode)
  // ============================================

  getToolingBreakdownTotal(quantity: number): number {
    const detail = this.toolingEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail?.totalToolingCostInTargetCurrency ?? 0;
  }

  getToolingBreakdownUnitCost(quantity: number): number {
    if (quantity === 0) return 0;
    return this.getToolingBreakdownTotal(quantity) / quantity;
  }

  getToolingBreakdownTotalWithMarkup(quantity: number): number {
    const detail = this.toolingEstimationDetails().find(
      (d) => d.quantity === quantity,
    );
    return detail?.totalToolingCostWithMarkupInTargetCurrency ?? 0;
  }

  getToolingBreakdownUnitPrice(quantity: number): number {
    if (quantity === 0) return 0;
    return this.getToolingBreakdownTotalWithMarkup(quantity) / quantity;
  }

  // ============================================
  // MARKUP ACTIONS
  // ============================================

  applyMarkup(): void {
    const markupValue = this.markup();
    const currencyCode = this.selectedCurrencyCode();
    if (markupValue == null || currencyCode == null) return;

    this.costRequestLineRepo
      .setCostRequestLineMarkup(
        this.costRequest().uid,
        this.line().uid,
        markupValue,
        currencyCode,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.applyEstimationData(result);
          this.handleMessage.successMessage("Markup applied successfully");
        },
      });
  }

  applyToolingMarkup(): void {
    const markupValue = this.toolingMarkup();
    const currencyCode = this.selectedCurrencyCode();
    if (markupValue == null || currencyCode == null) return;

    this.costRequestLineRepo
      .setToolingMarkup(
        this.costRequest().uid,
        this.line().uid,
        markupValue,
        currencyCode,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.applyEstimationData(result);
          this.handleMessage.successMessage(
            "Tooling markup applied successfully",
          );
        },
      });
  }

  private loadCurrencies(): void {
    this.currencyRepo
      .listAllCurrencies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.currencies.set(result);
        },
      });
  }

  private loadTargetCurrency(): void {
    this.globalConfigRepo
      .getSystemTargetCurrency()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (currency) => {
          this.targetCurrencyCode.set(currency.code);
          this.selectedCurrencyCode.set(currency.code);
          this.loadEstimationDetails();
        },
      });
  }

  private loadEstimationDetails(): void {
    const currencyCode = this.selectedCurrencyCode();
    const costRequestUid = this.costRequest().uid;
    const lineUid = this.line().uid;
    if (!costRequestUid || !lineUid || !currencyCode) return;

    this.loading.set(true);
    this.costRequestLineRepo
      .getEstimationDetails(costRequestUid, lineUid, currencyCode)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(
            () => {
              this.loading.set(false);
              this.withLoadingDelay.set(false);
            },
            this.withLoadingDelay() ? 800 : 0,
          );
        }),
      )
      .subscribe({
        next: (result) => {
          this.applyEstimationData(result);
        },
      });
  }

  private applyEstimationData(
    result: EstimationDetailsPerShipmentToCustomer[],
  ): void {
    this.estimationDataPerShipment.set(result);
    if (!result.length) {
      this.estimationData.set([]);
      this.selectedLocation.set(null);
      return;
    }

    const currentLocationKey = this.selectedLocation();
    let matched: EstimationDetailsPerShipmentToCustomer;

    if (currentLocationKey) {
      // Keep the currently selected location across reloads (markup apply, currency change…)
      matched =
        result.find(
          (r) =>
            this.buildLocationKey(r.locationName, r.currency.code) ===
            currentLocationKey,
        ) ?? result[0];
    } else {
      // First load: default to the first location and initialise the signal
      matched = result[0];
    }

    this.selectedLocation.set(
      this.buildLocationKey(matched.locationName, matched.currency.code),
    );
    this.estimationData.set(matched.estimationDetailsPerToolingStrategy);
  }

  private computeMarkupApprovalStatus(
    markup: number | null,
  ): "for-all" | "in-range" | "out-of-range" | null {
    const config = this.globalConfig();
    if (!config?.markupApprovalStrategy) return null;
    if (
      config.markupApprovalStrategy ===
      MarkupApprovalStrategy.FOR_ALL_QUOTATIONS
    )
      return "for-all";
    const range = this.approvalRange();
    if (!range || markup == null) return null;
    return markup >= range.lower && markup <= range.upper
      ? "in-range"
      : "out-of-range";
  }

  getCurrencyDisplay(): string {
    const code = this.selectedCurrencyCode();
    if (!code) return '';
    if (code === 'MYR') return 'RM';
    try {
      const parts = new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: code,
      }).formatToParts(0);
      return parts.find((p) => p.type === 'currency')?.value ?? code;
    } catch {
      return code;
    }
  }

  private buildLocationKey(locationName: string, currencyCode: string): string {
    return `${locationName}__${currencyCode}`;
  }
}
