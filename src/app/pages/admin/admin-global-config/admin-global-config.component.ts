import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { GlobalConfigRepo } from "../../../repositories/global-config.repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AutomaticExchangeRateFrequency,
  CurrencyExchangeRateStrategy,
  GlobalConfig,
  MarkupApprovalStrategy,
} from "../../../../client/costSeiko";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { FormsModule } from "@angular/forms";
import { InputNumberModule } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import { Icons } from "../../../models/enums/icons";
import { Divider } from "primeng/divider";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { EnumTransformerService } from "../../../services/components/enum-transformer.service";
import { MarkupApprovalStrategyPipe } from "../../../pipes/markup-approval-strategy.pipe";
import { CurrencyExchangeRateStrategyPipe } from "../../../pipes/currency-exchange-rate-strategy.pipe";
import { AutomaticExchangeRateFrequencyPipe } from "../../../pipes/automatic-exchange-rate-frequency.pipe";
import { Popover } from "primeng/popover";
import { DecimalPipe, NgClass } from "@angular/common";
import { finalize } from "rxjs";
import { Tooltip } from "primeng/tooltip";

interface FieldConfig {
  key: keyof GlobalConfig;
  label: string;
  type: "number" | "dropdown";
  suffix?: string;
  dependsOn?: {
    field: keyof GlobalConfig;
    value: string;
  };
}

@Component({
  selector: "app-admin-global-config",
  imports: [
    CardModule,
    CustomTitleComponent,
    FormsModule,
    InputNumberModule,
    Select,
    Button,
    Divider,
    Popover,
    NgClass,
    DecimalPipe,
    Tooltip,
  ],
  providers: [
    MarkupApprovalStrategyPipe,
    CurrencyExchangeRateStrategyPipe,
    AutomaticExchangeRateFrequencyPipe,
  ],
  templateUrl: "./admin-global-config.component.html",
  styleUrl: "./admin-global-config.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGlobalConfigComponent implements OnInit {
  globalConfig = signal<GlobalConfig | null>(null);
  initialGlobalConfig: GlobalConfig | null = null;
  isLoading = signal<boolean>(false);
  isSavingAll = signal<boolean>(false);
  title = RoutingService.getRouteTitle(RouteId.ADMIN_GLOBAL_CONFIG);
  // Enum options
  markupApprovalStrategyOptions = signal<
    { label: string; value: MarkupApprovalStrategy }[]
  >([]);
  currencyExchangeRateStrategyOptions = signal<
    { label: string; value: CurrencyExchangeRateStrategy }[]
  >([]);
  automaticExchangeRateFrequencyOptions = signal<
    { label: string; value: AutomaticExchangeRateFrequency }[]
  >([]);
  fieldConfigs = signal<FieldConfig[]>([
    {
      key: "laborCost",
      label: "Labor Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "overheadCost",
      label: "Overhead Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "internalTransportation",
      label: "Internal Transportation",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "depreciationCost",
      label: "Depreciation Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "administrationCost",
      label: "Administration Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "standardJigsAndFixturesCost",
      label: "Standard Jigs & Fixtures Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "smallPackagingCost",
      label: "Small Packaging Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "largePackagingCost",
      label: "Large Packaging Cost",
      type: "number",
      suffix: "currency units",
    },
    {
      key: "markupApprovalStrategy",
      label: "Markup Approval Strategy",
      type: "dropdown",
    },
    {
      key: "baseMarkup",
      label: "Base Markup",
      type: "number",
      suffix: "%",
      dependsOn: {
        field: "markupApprovalStrategy",
        value: "BASED_ON_CUSTOM_RULES",
      },
    },
    {
      key: "markupRange",
      label: "Lower/Higher markup range",
      type: "number",
      suffix: "%",
      dependsOn: {
        field: "markupApprovalStrategy",
        value: "BASED_ON_CUSTOM_RULES",
      },
    },
    {
      key: "costChangeAlert",
      label: "Cost Change Alert",
      type: "number",
      suffix: "%",
    },
    {
      key: "budgetaryAdditionalRate",
      label: "Budgetary Additional Rate",
      type: "number",
      suffix: "%",
    },
    {
      key: "npiProcessesAdditionalRate",
      label: "NPI Processes Additional Rate",
      type: "number",
      suffix: "%",
    },
    {
      key: "yieldPercentage",
      label: "Yield Percentage",
      type: "number",
      suffix: "%",
    },
    {
      key: "currencyExchangeRateStrategy",
      label: "Currency Exchange Rate Strategy",
      type: "dropdown",
    },
    // {
    //   key: "automaticExchangeRateFrequency",
    //   label: "Automatic Exchange Rate Frequency",
    //   type: "dropdown",
    // },
  ]);
  markupApprovalRange = computed<{ lower: number; upper: number } | null>(
    () => {
      const config = this.globalConfig();
      if (!config) return null;
      if (
        config.markupApprovalStrategy !==
        MarkupApprovalStrategy.BASED_ON_CUSTOM_RULES
      )
        return null;
      const base = config.baseMarkup;
      const range = config.markupRange;
      if (base == null || range == null) return null;
      return { lower: base - range, upper: base + range };
    },
  );
  protected readonly Icons = Icons;
  // Field labels mapping
  private fieldLabels: Record<string, string> = {
    laborCost: "Labor Cost",
    overheadCost: "Overhead Cost",
    internalTransportation: "Internal Transportation",
    depreciationCost: "Depreciation Cost",
    administrationCost: "Administration Cost",
    standardJigsAndFixturesCost: "Standard Jigs & Fixtures Cost",
    smallPackagingCost: "Small Packaging Cost",
    largePackagingCost: "Large Packaging Cost",
    markupApprovalStrategy: "Markup Approval Strategy",
    customRulesMarkupRange: "Custom Rules Markup Range",
    costChangeAlert: "Cost Change Alert",
    budgetaryAdditionalRate: "Budgetary Additional Rate",
    npiProcessesAdditionalRate: "NPI Processes Additional Rate",
    yieldPercentage: "Yield Percentage",
    currencyExchangeRateStrategy: "Currency Exchange Rate Strategy",
    automaticExchangeRateFrequency: "Automatic Exchange Rate Frequency",
  };
  private globalConfigRepo = inject(GlobalConfigRepo);
  private handleMessage = inject(HandleToastMessageService);
  private destroyRef = inject(DestroyRef);
  private enumTransformer = inject(EnumTransformerService);
  private markupApprovalStrategyPipe = inject(MarkupApprovalStrategyPipe);
  private currencyExchangeRateStrategyPipe = inject(
    CurrencyExchangeRateStrategyPipe,
  );
  private automaticExchangeRateFrequencyPipe = inject(
    AutomaticExchangeRateFrequencyPipe,
  );

  // MOCK DATA - Remove this when backend is ready
  ngOnInit() {
    this.initializeEnumOptions();
    this.loadGlobalConfig();
    this.loadTargetCurrency();
  }

  loadTargetCurrency() {
    this.globalConfigRepo
      .getSystemTargetCurrency()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currency) => {
        this.fieldConfigs.update((configs) =>
          configs.map((c) =>
            c.suffix === "currency units" ? { ...c, suffix: currency.code } : c,
          ),
        );
      });
  }

  loadGlobalConfig() {
    this.isLoading.set(true);
    // Real API call
    this.globalConfigRepo
      .getGlobalConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (config: GlobalConfig) => {
          this.globalConfig.set(config);
          this.initialGlobalConfig = { ...config };
          this.isLoading.set(false);
        },
      });
  }

  saveAllChanges() {
    const config = this.globalConfig();
    if (!config || !this.initialGlobalConfig) return;

    // Detect changes
    const patch: Partial<GlobalConfig> = {};
    Object.keys(config).forEach((key) => {
      const k = key as keyof GlobalConfig;
      if (config[k] !== this.initialGlobalConfig![k]) {
        patch[k] = config[k] as any;
      }
    });

    // No changes detected
    if (Object.keys(patch).length === 0) {
      this.handleMessage.successMessage("No changes to save");
      return;
    }

    this.isSavingAll.set(true);

    // Real API call
    this.globalConfigRepo
      .patchGlobalConfig(patch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingAll.set(false)),
      )
      .subscribe({
        next: (updatedConfig: GlobalConfig) => {
          this.globalConfig.set(updatedConfig);
          this.initialGlobalConfig = { ...updatedConfig };
          this.handleMessage.successMessage(
            `${Object.keys(patch).length} field(s) updated successfully`,
          );
          this.isSavingAll.set(false);
        },
      });
  }

  discardAllChanges() {
    if (!this.initialGlobalConfig) return;
    this.globalConfig.set({ ...this.initialGlobalConfig });
    this.handleMessage.infoMessage("All changes discarded");
  }

  hasChanges(): boolean {
    const config = this.globalConfig();
    if (!config || !this.initialGlobalConfig) return false;

    return Object.keys(config).some((key) => {
      const k = key as keyof GlobalConfig;
      return config[k] !== this.initialGlobalConfig![k];
    });
  }

  getChangedFields(): Array<{
    fieldKey: string;
    label: string;
    oldValue: string;
    newValue: string;
  }> {
    const config = this.globalConfig();
    if (!config || !this.initialGlobalConfig) return [];

    const changes: Array<{
      fieldKey: string;
      label: string;
      oldValue: string;
      newValue: string;
    }> = [];

    Object.keys(config).forEach((key) => {
      const k = key as keyof GlobalConfig;
      if (config[k] !== this.initialGlobalConfig![k]) {
        // Format enum values using pipes
        let oldValue = String(this.initialGlobalConfig![k] ?? "");
        let newValue = String(config[k] ?? "");

        if (k === "markupApprovalStrategy") {
          oldValue = this.markupApprovalStrategyPipe.transform(
            oldValue as MarkupApprovalStrategy,
          );
          newValue = this.markupApprovalStrategyPipe.transform(
            newValue as MarkupApprovalStrategy,
          );
        } else if (k === "currencyExchangeRateStrategy") {
          oldValue = this.currencyExchangeRateStrategyPipe.transform(
            oldValue as CurrencyExchangeRateStrategy,
          );
          newValue = this.currencyExchangeRateStrategyPipe.transform(
            newValue as CurrencyExchangeRateStrategy,
          );
        } else if (k === "automaticExchangeRateFrequency") {
          oldValue = this.automaticExchangeRateFrequencyPipe.transform(
            oldValue as AutomaticExchangeRateFrequency,
          );
          newValue = this.automaticExchangeRateFrequencyPipe.transform(
            newValue as AutomaticExchangeRateFrequency,
          );
        }

        changes.push({
          fieldKey: key,
          label: this.fieldLabels[key] || key,
          oldValue,
          newValue,
        });
      }
    });

    return changes;
  }

  isFieldModified(fieldKey: keyof GlobalConfig): boolean {
    const config = this.globalConfig();
    if (!config || !this.initialGlobalConfig) return false;
    return config[fieldKey] !== this.initialGlobalConfig[fieldKey];
  }

  scrollToField(fieldKey: string) {
    const element = document.getElementById(`field-${fieldKey}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        element.focus();
      }, 500);
    }
  }

  isFieldVisible(field: FieldConfig): boolean {
    if (!field.dependsOn) return true;
    const config = this.globalConfig();
    if (!config) return false;
    return config[field.dependsOn.field] === field.dependsOn.value;
  }

  getFieldValue(key: keyof GlobalConfig): string | number | undefined {
    const config = this.globalConfig();
    if (!config) return undefined;
    const value = config[key];
    if (typeof value === "string" && !isNaN(Number(value))) {
      return Number(value);
    }
    return value as string | number | undefined;
  }

  setFieldValue(key: keyof GlobalConfig, value: string | number) {
    const config = this.globalConfig();
    if (!config) return;
    this.globalConfig.set({
      ...config,
      [key]: value,
    });
  }

  getFieldOptions(
    key: keyof GlobalConfig,
  ):
    | { label: string; value: string }[]
    | { label: string; value: MarkupApprovalStrategy }[]
    | { label: string; value: CurrencyExchangeRateStrategy }[]
    | { label: string; value: AutomaticExchangeRateFrequency }[] {
    switch (key) {
      case "markupApprovalStrategy":
        return this.markupApprovalStrategyOptions();
      case "currencyExchangeRateStrategy":
        return this.currencyExchangeRateStrategyOptions();
      case "automaticExchangeRateFrequency":
        return this.automaticExchangeRateFrequencyOptions();
      default:
        return [];
    }
  }

  private initializeEnumOptions() {
    this.markupApprovalStrategyOptions.set(
      this.enumTransformer.enumToLabelValue(
        MarkupApprovalStrategy,
        (value: MarkupApprovalStrategy) =>
          this.markupApprovalStrategyPipe.transform(value),
      ),
    );

    this.currencyExchangeRateStrategyOptions.set(
      this.enumTransformer.enumToLabelValue(
        CurrencyExchangeRateStrategy,
        (value: CurrencyExchangeRateStrategy) =>
          this.currencyExchangeRateStrategyPipe.transform(value),
      ),
    );

    this.automaticExchangeRateFrequencyOptions.set(
      this.enumTransformer.enumToLabelValue(
        AutomaticExchangeRateFrequency,
        (value: AutomaticExchangeRateFrequency) =>
          this.automaticExchangeRateFrequencyPipe.transform(value),
      ),
    );
  }
}
