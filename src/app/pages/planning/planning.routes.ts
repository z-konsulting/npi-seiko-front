import { Routes } from "@angular/router";
import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { PlanningListComponent } from "./planning-list/planning-list.component";

export const planningRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.PLANNING_LIST).path,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PLANNING_LIST).path,
    component: PlanningListComponent,
  },
];
