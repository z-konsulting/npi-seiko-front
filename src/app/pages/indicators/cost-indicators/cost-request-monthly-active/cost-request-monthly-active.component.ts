import { Component, inject, OnInit, signal } from "@angular/core";
import { BaseListComponent } from "../../../../models/classes/base-list-component";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HandleToastMessageService } from "../../../../services/handle-toast-message.service";
import { IndicatorsRepo } from "../../../../repositories/indicators.repo";
import { CustomerRepo } from "../../../../repositories/customer.repo";
import { Graph, IndicatorsBody } from "../../../../../client/costSeiko";
import { IndicatorFilterComponent } from "../../../../components/indicator-filter/indicator-filter.component";
import {
  ChartType,
  EchartsGraphComponent,
} from "../../../../components/echarts-graph/echarts-graph.component";

@Component({
  selector: "app-cost-request-monthly-active",
  imports: [IndicatorFilterComponent, EchartsGraphComponent],
  templateUrl: "./cost-request-monthly-active.component.html",
  styleUrl: "./cost-request-monthly-active.component.scss",
})
export class CostRequestMonthlyActiveComponent
  extends BaseListComponent
  implements OnInit
{
  readonly indicatorsRepo = inject(IndicatorsRepo);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly handleMessage = inject(HandleToastMessageService);
  readonly customerRepo = inject(CustomerRepo);
  graph = signal<Graph | null>(null);
  protected readonly ChartType = ChartType;

  constructor() {
    super();
  }

  ngOnInit() {}

  loadIndicatorData(body?: IndicatorsBody) {
    if (!body) return;
    this.indicatorsRepo
      .indicatorsCostRequestsDataMonthlyCompletedCostAsGraph(body?.customerIds)
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
