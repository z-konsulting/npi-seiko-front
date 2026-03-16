import { Routes } from "@angular/router";

import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { PendingApprovalListComponent } from "./pending-approval/pending-approval-list.component";

export const managementRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: RoutingService.getRouteEnv(RouteId.MANAGEMENT_PENDING_APPROVAL)
      .path,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.MANAGEMENT_PENDING_APPROVAL).path,
    component: PendingApprovalListComponent,
  },
];
