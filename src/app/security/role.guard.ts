import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "./authentication.service";
import { HandleToastMessageService } from "../services/handle-toast-message.service";
import { AccessService } from "../services/Access.service";
import { RouteId } from "../models/enums/routes-id";
import { StateParamKey } from "../models/enums/stateParamKey";
import { RoutingService } from "../services/Routing.service";

@Injectable({
  providedIn: "root",
})
export class RoleGuard {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private handleMessage = inject(HandleToastMessageService);

  canActivate(routeId: RouteId): boolean {
    const role = this.authService.getRole();
    if (role && AccessService.canAccess(routeId, role)) return true;
    if (!role) {
      this.router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)], {
        state: {
          [StateParamKey.DISCONNECTED]: true,
          [StateParamKey.REASON]: "session expired",
        },
      });
      return false;
    }

    this.handleMessage.errorMessage(
      "You do not have the necessary authorizations to access this resource.",
    );
    const homePath = RoutingService.getFullPath(
      AccessService.getHomeRouteId(role),
    );
    this.router.navigate([homePath]);
    return false;
  }
}
