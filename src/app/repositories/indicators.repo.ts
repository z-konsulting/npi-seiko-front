import { Injectable } from "@angular/core";
import { fromRequest } from "../services/utils/api-utils";
import { Indicator as IndicatorSDK } from "../../client/costSeiko";

@Injectable({
  providedIn: "root",
})
export class IndicatorsRepo {
  constructor(private readonly indicatorsService: IndicatorSDK) {}

  indicatorsCostRequestsDataMonthlyCompletedCostLeadTimeAsGraph(
    customerIds?: string[],
  ) {
    const body: any = {
      customerIds,
    };
    return fromRequest(
      this.indicatorsService.indicatorsCostRequestsDataMonthlyCompletedCostLeadTimeAsGraph(
        {
          body: body,
        },
      ),
    );
  }

  indicatorsCostRequestsDataMonthlyCompletedCostAsGraph(
    customerIds?: string[],
  ) {
    const body: any = {
      customerIds,
    };
    return fromRequest(
      this.indicatorsService.indicatorsCostRequestsDataMonthlyCompletedCostAsGraph(
        {
          body: body,
        },
      ),
    );
  }
}
