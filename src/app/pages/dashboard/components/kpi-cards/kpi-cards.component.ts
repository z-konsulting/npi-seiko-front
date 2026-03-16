import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";
import { DashboardGlobalKpis } from "../../../../../client/costSeiko";
import { Icons } from "../../../../models/enums/icons";

@Component({
  selector: "app-kpi-cards",
  imports: [DecimalPipe, TooltipModule],
  templateUrl: "./kpi-cards.component.html",
  styleUrl: "./kpi-cards.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardsComponent {
  kpis = input<DashboardGlobalKpis | undefined>(undefined);

  atRiskClick = output<void>();

  totalOpenCostRequests = computed(
    () => this.kpis()?.totalOpenCostRequests ?? 0,
  );
  avgLeadTimeOpen = computed(
    () => this.kpis()?.averageLeadTimeDaysOpenCostRequests ?? 0,
  );
  totalActiveCostRequests = computed(
    () => this.kpis()?.totalActiveCostRequests ?? 0,
  );
  avgLeadTimeActive = computed(
    () => this.kpis()?.averageLeadTimeDaysActiveCostRequests ?? 0,
  );
  totalWonCostRequests = computed(
    () => this.kpis()?.totalWonCostRequests ?? 0,
  );
  avgLeadTimeWon = computed(
    () => this.kpis()?.averageLeadTimeDaysWonCostRequests ?? 0,
  );
  totalLostCostRequests = computed(
    () => this.kpis()?.totalLostCostRequests ?? 0,
  );
  avgLeadTimeLost = computed(
    () => this.kpis()?.averageLeadTimeDaysLostCostRequests ?? 0,
  );
  totalNewRevisionCostRequests = computed(
    () => this.kpis()?.totalNewRevisionCostRequests ?? 0,
  );
  avgLeadTimeNewRevision = computed(
    () => this.kpis()?.averageLeadTimeDaysNewRevisionCostRequests ?? 0,
  );
  pipelineValue = computed(
    () => this.kpis()?.pipelineValueInTargetCurrency ?? 0,
  );
  atRiskCount = computed(() => this.kpis()?.costRequestsAtRisk?.length ?? 0);
  expiredCount = computed(() => this.kpis()?.expiredCostRequest?.length ?? 0);

  expiredClick = output<void>();

  protected readonly Icons = Icons;
}
