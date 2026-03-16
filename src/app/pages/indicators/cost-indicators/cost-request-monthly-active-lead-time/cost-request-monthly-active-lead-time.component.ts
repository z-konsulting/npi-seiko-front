import { Component, inject, OnInit, signal } from "@angular/core";
import { IndicatorFilterComponent } from "../../../../components/indicator-filter/indicator-filter.component";
import {
  ChartType,
  EchartsGraphComponent,
} from "../../../../components/echarts-graph/echarts-graph.component";
import { BaseListComponent } from "../../../../models/classes/base-list-component";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IndicatorsRepo } from "../../../../repositories/indicators.repo";
import { HandleToastMessageService } from "../../../../services/handle-toast-message.service";
import { GraphWhisker, IndicatorsBody } from "../../../../../client/costSeiko";
import { CustomerRepo } from "../../../../repositories/customer.repo";

@Component({
  selector: "app-cost-request-monthly-active-lead-time",
  imports: [IndicatorFilterComponent, EchartsGraphComponent],
  templateUrl: "./cost-request-monthly-active-lead-time.component.html",
  styleUrl: "./cost-request-monthly-active-lead-time.component.scss",
})
export class CostRequestMonthlyActiveLeadTimeComponent
  extends BaseListComponent
  implements OnInit
{
  readonly indicatorsRepo = inject(IndicatorsRepo);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly handleMessage = inject(HandleToastMessageService);
  readonly customerRepo = inject(CustomerRepo);
  graph = signal<GraphWhisker | null>(null);
  protected readonly ChartType = ChartType;

  constructor() {
    super();
  }

  ngOnInit() {}

  loadIndicatorData(body?: IndicatorsBody) {
    if (!body) return;
    this.indicatorsRepo
      .indicatorsCostRequestsDataMonthlyCompletedCostLeadTimeAsGraph(
        body?.customerIds,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (graph) => this.graph.set(graph),
        error: (error) => {
          this.handleMessage.handleErrorWithCodeV2(error);
        },
      });
  }

  indicatorBodyReceiver(indicatorBody: IndicatorsBody) {
    this.loadIndicatorData(indicatorBody);
  }
}
