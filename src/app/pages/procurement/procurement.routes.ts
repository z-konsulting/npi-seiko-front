import { Routes } from "@angular/router";
import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { MaterialsEstimatedComponent } from "./materials/materials-estimated/materials-estimated.component";
import { MaterialsToEstimatedComponent } from "./materials/materials-to-estimated/materials-to-estimated.component";
import { ToolingProcurementComponent } from "./tooling-procurement/tooling-procurement.component";
import { CostRequestLineProcurementComponent } from "./cost-request-line-procurement/cost-request-line-procurement.component";

export const procurementRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.PROCUREMENT_MATERIAL).path,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PROCUREMENT_MATERIAL).path,
    // canActivate: [() => inject(RoleGuard).canActivate(RouteId.PROCUREMENT_MATERIAL)],
    children: [
      {
        path: "",
        redirectTo: RoutingService.getRouteEnv(RouteId.MATERIALS_TO_ESTIMATE)
          .path,
        pathMatch: "full",
      },
      {
        path: RoutingService.getRouteEnv(RouteId.MATERIALS_TO_ESTIMATE).path,
        component: MaterialsToEstimatedComponent,
      },
      {
        path: RoutingService.getRouteEnv(RouteId.MATERIALS_ESTIMATED).path,
        component: MaterialsEstimatedComponent,
      },
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PROCUREMENT_TOOLING).path,
    component: ToolingProcurementComponent,
    // canActivate: [() => inject(RoleGuard).canActivate(RouteId.PROCUREMENT_TOOLING)],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PROCUREMENT_COST_REQUEST_LINE)
      .path,
    component: CostRequestLineProcurementComponent,
    // canActivate: [() => inject(RoleGuard).canActivate(RouteId.PROCUREMENT_COST_REQUEST_LINE)],
  },
];
