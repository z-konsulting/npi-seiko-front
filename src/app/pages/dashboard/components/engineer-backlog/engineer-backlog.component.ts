import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { NgxEchartsDirective } from "ngx-echarts";
import { EChartsOption } from "echarts";
import { DashboardEngineerBacklog } from "../../../../../client/costSeiko";

@Component({
  selector: "app-engineer-backlog",
  imports: [NgxEchartsDirective],
  templateUrl: "./engineer-backlog.component.html",
  styleUrl: "./engineer-backlog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngineerBacklogComponent {
  data = input<DashboardEngineerBacklog | undefined>(undefined);

  totalItems = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return (d.readyToEstimateCount ?? 0) + (d.readyForReviewCount ?? 0) + (d.pendingReestimationCount ?? 0);
  });

  chartOptions = computed<EChartsOption>(() => {
    const d = this.data();
    const rte = d?.readyToEstimateCount ?? 0;
    const rfr = d?.readyForReviewCount ?? 0;
    const pr = d?.pendingReestimationCount ?? 0;

    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          label: { show: false },
          emphasis: {
            label: { show: false },
          },
          data: [
            { value: rte, name: "Ready to Estimate", itemStyle: { color: "#0891b2" } },
            { value: rfr, name: "Ready for Review", itemStyle: { color: "#8b5cf6" } },
            { value: pr, name: "Pending Reestimation", itemStyle: { color: "#0e7490" } },
          ],
        },
      ],
    };
  });
}
