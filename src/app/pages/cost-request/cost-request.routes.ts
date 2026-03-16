import { Routes } from "@angular/router";

import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { CostRequestListComponent } from "./cost-request-list/cost-request-list.component";
import { CostRequestCostingComponent } from "./cost-request-costing/cost-request-costing.component";

export const costRequestRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.QUOTATION).path,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.QUOTATION).path,
    component: CostRequestListComponent,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.COST_REQUEST_COSTING).path,
    component: CostRequestCostingComponent,
  },
];
