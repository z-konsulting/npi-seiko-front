import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { NgxEchartsDirective } from "ngx-echarts";
import { EChartsOption } from "echarts";
import {
  CostRequestStatus,
  DashboardCostRequestCountByStatus,
} from "../../../../../client/costSeiko";

// Colors mirror the CSS variables defined in global.scss (--status-*)
const STATUS_COLORS: Record<string, string> = {
  [CostRequestStatus.PENDING_INFORMATION]: "#f97316", // --status-pending-information
  [CostRequestStatus.READY_FOR_REVIEW]: "#8b5cf6", // --status-ready-for-review
  [CostRequestStatus.READY_TO_ESTIMATE]: "#0891b2", // --status-ready-to-estimate
  // [CostRequestStatus.ESTIMATED]: "#48b461", // --status-estimated
  [CostRequestStatus.READY_FOR_MARKUP]: "#3b82f6", // --status-ready-for-markup
  [CostRequestStatus.PENDING_APPROVAL]: "#ea9658", // --status-pending-approval
  [CostRequestStatus.PRICE_APPROVED]: "#48b461", // --status-price-approved
  [CostRequestStatus.PRICE_REJECTED]: "#dc3545", // --status-price-rejected
  [CostRequestStatus.PENDING_REESTIMATION]: "#0e7490", // --status-pending-reestimation
  [CostRequestStatus.READY_TO_QUOTE]: "#1e3a8a", // --status-ready-to-quote
  [CostRequestStatus.ABORTED]: "#707f94", // --status-aborted
  [CostRequestStatus.NEW_REVISION_CREATED]: "#546e7a", // --status-new-revision-created
  [CostRequestStatus.READY_TO_VALIDATE]: "#15a378", // --status-ready-to-validate
  [CostRequestStatus.ACTIVE]: "#0d9488", // --status-active
  [CostRequestStatus.WON]: "#24844a", // --status-won
  [CostRequestStatus.LOST]: "#b84a4a", // --status-lost
};

const STATUS_LABELS: Record<string, string> = {
  [CostRequestStatus.READY_TO_QUOTE]: "Ready to Quote",
  [CostRequestStatus.READY_FOR_MARKUP]: "Ready for Markup",
  [CostRequestStatus.PENDING_REESTIMATION]: "Pending Reestimation",
  [CostRequestStatus.READY_TO_ESTIMATE]: "Ready to Estimate",
  [CostRequestStatus.READY_FOR_REVIEW]: "Ready for Review",
  [CostRequestStatus.PENDING_INFORMATION]: "Pending Info",
  [CostRequestStatus.ABORTED]: "Aborted",
  [CostRequestStatus.NEW_REVISION_CREATED]: "New Revision Created",
  [CostRequestStatus.READY_TO_VALIDATE]: "Ready to Validate",
  [CostRequestStatus.ACTIVE]: "Active",
  [CostRequestStatus.WON]: "Won",
  [CostRequestStatus.LOST]: "Lost",
};

@Component({
  selector: "app-status-bar-chart",
  imports: [NgxEchartsDirective],
  templateUrl: "./status-bar-chart.component.html",
  styleUrl: "./status-bar-chart.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarChartComponent {
  data = input<DashboardCostRequestCountByStatus[] | undefined>(undefined);

  chartOptions = computed<EChartsOption>(() => {
    const items = (this.data() ?? []).filter(
      (d) => d.status && (d.count ?? 0) > 0,
    );

    const labels = items.map((d) => STATUS_LABELS[d.status!] ?? d.status!);
    const values = items.map((d) => d.count ?? 0);
    const colors = items.map((d) => STATUS_COLORS[d.status!] ?? "#6b7280");

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<strong>${p.name}</strong>: ${p.value}`;
        },
      },
      grid: {
        left: "2%",
        right: "8%",
        top: "4%",
        bottom: "4%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(0,0,0,0.06)" } },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          fontSize: 11,
          color: "#6b7280",
        },
      },
      series: [
        {
          type: "bar",
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i], borderRadius: [0, 4, 4, 0] },
          })),
          barMaxWidth: 24,
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            fontWeight: 600,
            color: "#374151",
          },
        },
      ],
    };
  });
}
