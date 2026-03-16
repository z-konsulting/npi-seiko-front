import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { CardModule } from "primeng/card";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GlobalConfigRepo } from "../../../repositories/global-config.repo";
import { BaseModal } from "../../../models/classes/base-modal";
import {
  CostingMethodType,
  CostRequest,
  CostRequestLine,
  CostRequestLineCostingPerQuantity,
  CostRequestStatus,
  GlobalConfig,
  MarkupApprovalStrategy,
  MaterialCostLine,
  OtherCostLine,
  OutsourcingStatus,
  ProcessCostLine,
  ToolingCostLine,
  ToolingStrategy,
} from "../../../../client/costSeiko";
import { Tab, TabList, TabPanel, Tabs } from "primeng/tabs";
import { ProcessEstimationTabComponent } from "./tabs/process-estimation/process-estimation-tab.component";
import { MaterialCostEstimationTabComponent } from "./tabs/material-cost-estimation/material-cost-estimation-tab.component";
import { OtherCostEstimationTabComponent } from "./tabs/other-cost-estimation/other-cost-estimation-tab.component";
import { ToolingCostEstimationTabComponent } from "./tabs/tooling-cost-estimation/tooling-cost-estimation-tab.component";
import { DecimalPipe } from "@angular/common";
import { Tag } from "primeng/tag";
import { ConfirmationService } from "primeng/api";
import { finalize } from "rxjs";
import { CostBreakdownViewComponent } from "./breakdown/cost-breakdown-view.component";
import { CostRequestLineRepo } from "../../../repositories/cost-request-line.repo";
import { OutsourcingStatusPipe } from "../../../pipes/outsourcing-status.pipe";
import { InfoBannerComponent } from "../../../components/info-banner/info-banner.component";
import { CostRequestService } from "../../../services/cost-request.service";

@Component({
  selector: "app-cost-request-line-estimation-dialog",
  imports: [
    CardModule,
    Button,
    Tabs,
    TabPanel,
    ProcessEstimationTabComponent,
    MaterialCostEstimationTabComponent,
    OtherCostEstimationTabComponent,
    ToolingCostEstimationTabComponent,
    DecimalPipe,
    TabList,
    Tab,
    CostBreakdownViewComponent,
    Tag,
    OutsourcingStatusPipe,
    InfoBannerComponent,
  ],
  templateUrl: "./cost-request-line-estimation-dialog.component.html",
  styleUrl: "./cost-request-line-estimation-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostRequestLineEstimationDialogComponent
  extends BaseModal
  implements OnInit
{
  costRequest = signal<CostRequest | null>(null);
  line = signal<CostRequestLine | null>(null);
  loading = signal<boolean>(true);
  isEngineering = signal<boolean>(false);

  selectedQuantity = signal<number>(1);
  isOutsourced = computed<boolean>(() => this.line()?.outsourced === true);
  isPriceRejected = computed<boolean>(
    () => this.line()?.status === CostRequestStatus.PRICE_REJECTED,
  );
  isPriceApproved = computed<boolean>(
    () => this.line()?.status === CostRequestStatus.PRICE_APPROVED,
  );
  // Data grouped by quantity (received from backend)
  costingByQuantity = signal<CostRequestLineCostingPerQuantity[]>([]);
  // Data for the selected quantity (computed from grouped data)
  processLinesDisplay = computed<ProcessCostLine[]>(() => {
    const data = this.costingByQuantity();
    const selected = this.selectedQuantity();
    const found = data.find((item) => item.quantity === selected);
    return found?.processCostLines || [];
  });
  materialCostLinesDisplay = computed<MaterialCostLine[]>(() => {
    const data = this.costingByQuantity();
    const selected = this.selectedQuantity();
    const found = data.find((item) => item.quantity === selected);
    return found?.materialCostLines || [];
  });
  otherCostLinesDisplay = computed<OtherCostLine[]>(() => {
    const data = this.costingByQuantity();
    const selected = this.selectedQuantity();
    const found = data.find((item) => item.quantity === selected);
    return found?.otherCostLines || [];
  });
  toolingCostLinesDisplay = computed<ToolingCostLine[]>(() => {
    const data = this.costingByQuantity();
    const selected = this.selectedQuantity();
    const found = data.find((item) => item.quantity === selected);
    return found?.toolingCostLines || [];
  });
  // Costs from tabs
  processTotalCost = signal<number>(0);
  materialCostTotalCost = signal<number>(0);
  otherCostTotalCost = signal<number>(0);
  toolingCostTotalCost = signal<number>(0);
  totalCost = computed(
    () =>
      this.processTotalCost() +
      this.materialCostTotalCost() +
      this.otherCostTotalCost() +
      this.toolingCostTotalCost(),
  );
  activeView = signal<"detail" | "breakdown">("detail");
  isReadyToQuote = computed<boolean>(() => {
    return (
      this.line()?.status === CostRequestStatus.READY_FOR_MARKUP ||
      this.line()?.status === CostRequestStatus.PRICE_REJECTED
    );
  });
  validatingPrice = signal<boolean>(false);
  globalConfig = signal<GlobalConfig | null>(null);
  availableQuantities = computed<number[]>(() => {
    const line = this.line();
    if (!line) return [1];

    if (this.isEstimated()) {
      const quantities = line.quantities || [1];
      if (!quantities.includes(1)) {
        return [1, ...quantities].sort((a, b) => a - b);
      }
      return quantities.sort((a, b) => a - b);
    }

    return [1];
  });
  isReadOnly = computed<boolean>(() => {
    return this.isEstimated() || this.isOutsourced();
  });
  protected readonly Icons = Icons;
  protected readonly CostingMethodType = CostingMethodType;
  protected readonly OutsourcingStatus = OutsourcingStatus;
  private costRequestLineRepo = inject(CostRequestLineRepo);
  private globalConfigRepo = inject(GlobalConfigRepo);
  private confirmationService = inject(ConfirmationService);
  private costRequestService = inject(CostRequestService);
  isEstimated = computed<boolean>(() => {
    const status = this.line()?.status;
    if (status == null) return false;
    return (
      status === CostRequestStatus.READY_FOR_MARKUP ||
      status === CostRequestStatus.PENDING_APPROVAL ||
      status === CostRequestStatus.PRICE_APPROVED ||
      status === CostRequestStatus.PRICE_REJECTED ||
      status === CostRequestStatus.READY_TO_QUOTE ||
      (!this.costRequestService.isAborted(status) &&
        this.costRequestService.isFinalized(status))
    );
  });
  private processTab = viewChild(ProcessEstimationTabComponent);
  private otherCostTab = viewChild(OtherCostEstimationTabComponent);
  private toolingCostTab = viewChild(ToolingCostEstimationTabComponent);
  private breakdownView = viewChild(CostBreakdownViewComponent);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.costRequest.set(this.config.data.costRequest);
    this.line.set(this.config.data.line);
    this.isEngineering.set(this.config.data.isEngineering ?? false);

    const defaultView =
      this.config.data.defaultView ??
      (this.isEstimated() ? "breakdown" : "detail");
    this.activeView.set(defaultView);

    if (!this.isEstimated()) {
      this.selectedQuantity.set(1);
    } else {
      const quantities = this.availableQuantities();
      if (quantities.length > 0) {
        this.selectedQuantity.set(quantities[0]);
      }
    }

    this.loadData();
    this.globalConfigRepo
      .getGlobalConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (config) => this.globalConfig.set(config) });
  }

  loadData(): void {
    const costRequestUid = this.costRequest()?.uid;
    const lineUid = this.line()?.uid;

    if (!costRequestUid || !lineUid) {
      this.handleMessage.errorMessage("Invalid request for quotation");
      return;
    }

    this.loading.set(true);

    this.costRequestLineRepo
      .getCostRequestLineCosting(costRequestUid, lineUid)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.updateDataFromResponse(result);
        },
      });
  }

  selectQuantity(quantity: number): void {
    if (this.selectedQuantity() === quantity) return;
    this.selectedQuantity.set(quantity);
  }

  onProcessTotalChange(total: number): void {
    this.processTotalCost.set(total);
  }

  onMaterialCostTotalChange(total: number): void {
    this.materialCostTotalCost.set(total);
  }

  onOtherCostTotalChange(total: number): void {
    this.otherCostTotalCost.set(total);
  }

  onToolingCostTotalChange(total: number): void {
    this.toolingCostTotalCost.set(total);
  }

  validatePrice(event: any): void {
    const costRequestUid = this.costRequest()?.uid;
    if (!costRequestUid) return;
    const lineUid = this.line()?.uid;
    if (!costRequestUid || !lineUid) return;
    const line = this.line()!;
    const markup = this.breakdownView()?.markup() ?? line.markup;
    if (markup == null) {
      this.handleMessage.errorMessage("Markup is not set");
      return;
    }
    let approvalNote;
    const separatedStrategy =
      this.line()?.toolingStrategy ?? ToolingStrategy.AMORTIZED;
    if (separatedStrategy === ToolingStrategy.SEPARATED) {
      const toolingMarkup =
        this.breakdownView()?.toolingMarkup() ?? line.toolingMarkup;
      if (toolingMarkup == null) {
        this.handleMessage.errorMessage("Tooling markup is not set");
        return;
      }
      approvalNote = this.buildApprovalNote(markup, toolingMarkup);
    } else {
      approvalNote = this.buildApprovalNote(markup, null);
    }

    this.validatingPrice.set(true);
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Validate price for line ${line.customerPartNumber} - rev ${line.customerPartNumberRevision}? ${approvalNote}`,
      header: "Validate price",
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmDialogKey",
      closable: false,
      rejectButtonProps: {
        label: "Cancel",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Validate",
      },
      accept: () => {
        this.costRequestLineRepo
          .validateCostRequestLinePrice(costRequestUid, lineUid)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.validatingPrice.set(false)),
          )
          .subscribe({
            next: () => {
              this.handleMessage.successMessage("Price validated successfully");
              this.ref.close(true);
            },
          });
      },
      reject: () => {
        this.validatingPrice.set(false);
      },
    });
  }

  cancel(): void {
    if (this.isEstimated()) return this.ref.close(true);

    const hasUnsavedRows =
      this.processTab()?.hasUnsavedRows() ||
      this.otherCostTab()?.hasUnsavedRows() ||
      this.toolingCostTab()?.hasUnsavedRows();

    if (hasUnsavedRows) {
      this.confirmationService.confirm({
        message:
          "You have rows in edit mode. Are you sure you want to close? Unsaved rows will be lost.",
        header: "Unsaved Rows",
        icon: "pi pi-exclamation-triangle warning",
        key: "confirmDialogKey",
        rejectButtonProps: {
          label: "No, stay",
          outlined: true,
        },
        acceptButtonProps: { label: "Yes" },
        accept: () => {
          this.ref.close(true);
        },
        reject: () => {},
      });
    } else {
      this.ref.close(true);
    }
  }

  private buildApprovalNote(
    markup: number | null | undefined,
    toolingMarkup: number | null | undefined,
  ): string {
    if (markup == null) return "";
    const config = this.globalConfig();
    if (!config?.markupApprovalStrategy) return "";
    if (
      config.markupApprovalStrategy ===
      MarkupApprovalStrategy.FOR_ALL_QUOTATIONS
    )
      return "Approval will be required.";
    if (
      config.markupApprovalStrategy ===
      MarkupApprovalStrategy.BASED_ON_CUSTOM_RULES
    ) {
      const base = config.baseMarkup;
      const range = config.markupRange;
      if (base == null || range == null) return "";
      const lower = Math.max(0, base - range);
      const upper = Math.min(100, base + range);
      if (toolingMarkup) {
        return markup >= lower &&
          markup <= upper &&
          toolingMarkup >= lower &&
          toolingMarkup <= upper
          ? "Will be auto-approved."
          : "Approval will be required.";
      } else {
        return markup >= lower && markup <= upper
          ? "Will be auto-approved."
          : "Approval will be required.";
      }
    }
    return "";
  }

  private updateDataFromResponse(
    result: CostRequestLineCostingPerQuantity[],
  ): void {
    const data = result || [];

    if (!this.isEstimated()) {
      this.costingByQuantity.set(data.filter((item) => item.quantity === 1));
    } else {
      this.costingByQuantity.set(data);
    }
  }
}
