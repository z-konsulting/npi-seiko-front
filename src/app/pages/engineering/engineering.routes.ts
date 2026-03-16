import { Routes } from "@angular/router";

import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { EngineeringQuotationComponent } from "./engineering-quotation/engineering-quotation.component";
import { EngineeringCostingComponent } from "./engineering-costing/engineering-costing.component";

export const engineeringRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.ENGINEERING_QUOTATION).path,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ENGINEERING_QUOTATION).path,
    component: EngineeringQuotationComponent,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ENGINEERING_COSTING).path,
    component: EngineeringCostingComponent,
  },
];
