import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { RoutingService } from '../services/Routing.service';
import { RouteId } from '../models/enums/routes-id';
import { AccessService } from '../services/Access.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)]);
      return false;
    }
    return true;
  }

  redirectToDashboardIfLogged(): boolean {
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getRole();
      const homeRouteId = role
        ? AccessService.getHomeRouteId(role)
        : RouteId.DASHBOARD;
      this.router.navigate([RoutingService.fullPathRoute(homeRouteId)]);
      return false;
    }
    return true;
  }
}
