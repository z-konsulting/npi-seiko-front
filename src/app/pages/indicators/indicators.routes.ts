import { Routes } from "@angular/router";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { CostIndicatorsComponent } from "./cost-indicators/cost-indicators.component";
import { CostRequestMonthlyActiveComponent } from "./cost-indicators/cost-request-monthly-active/cost-request-monthly-active.component";
import { CostRequestMonthlyActiveLeadTimeComponent } from "./cost-indicators/cost-request-monthly-active-lead-time/cost-request-monthly-active-lead-time.component";

export const indicatorsRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.INDICATORS_CSR).path,
  },
  {
    path: `${RoutingService.getRouteEnv(RouteId.INDICATORS_CSR).path}`,
    component: CostIndicatorsComponent,
    children: [
      {
        path: "",
        redirectTo: RoutingService.getRouteEnv(
          RouteId.COST_REQUESTS_MONTHLY_ACTIVE,
        ).path,
        pathMatch: "full",
      },
      {
        path: RoutingService.getRouteEnv(RouteId.COST_REQUESTS_MONTHLY_ACTIVE)
          .path,
        component: CostRequestMonthlyActiveComponent,
      },
      {
        path: RoutingService.getRouteEnv(
          RouteId.COST_REQUESTS_MONTHLY_ACTIVE_LEAD_TIME,
        ).path,
        component: CostRequestMonthlyActiveLeadTimeComponent,
      },
    ],
  },
];
