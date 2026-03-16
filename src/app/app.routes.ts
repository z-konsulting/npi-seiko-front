import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/public/login/login.component";
import { AuthGuardService } from "./security/auth.guard.service";
import { inject } from "@angular/core";
import { RoleGuard } from "./security/role.guard";
import { RoutingService } from "./services/Routing.service";
import { RouteId } from "./models/enums/routes-id";
import { ForgotPasswordComponent } from "./pages/public/forgot-password/forgot-password.component";
import { ResetPasswordComponent } from "./pages/public/reset-password/reset-password.component";
import { SetFirstPasswordComponent } from "./pages/public/set-first-password/set-first-password.component";

export const routes: Routes = [
  {
    path: "",
    redirectTo: RoutingService.getRouteEnv(RouteId.LOGIN).path,
    pathMatch: "full",
  },
  {
    path: RoutingService.getRouteEnv(RouteId.LOGIN).path,
    component: LoginComponent,
    canActivate: [() => inject(AuthGuardService).redirectToDashboardIfLogged()],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.FORGOT_PASSWORD).path,
    component: ForgotPasswordComponent,
    canActivate: [() => inject(AuthGuardService).redirectToDashboardIfLogged()],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.RESET_PASSWORD).path,
    component: ResetPasswordComponent,
    canActivate: [() => inject(AuthGuardService).redirectToDashboardIfLogged()],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.SET_FIRST_PASSWORD).path,
    component: SetFirstPasswordComponent,
    canActivate: [() => inject(AuthGuardService).redirectToDashboardIfLogged()],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.DASHBOARD).path,
    loadChildren: () =>
      import("./pages/dashboard/dashboard.routes").then(
        (m) => m.dashboardRoutes,
      ),
    canActivate: [() => inject(AuthGuardService).canActivate()],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.COST_REQUEST).path,
    loadChildren: () =>
      import("./pages/cost-request/cost-request.routes").then(
        (m) => m.costRequestRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.COST_REQUEST),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ENGINEERING).path,
    loadChildren: () =>
      import("./pages/engineering/engineering.routes").then(
        (m) => m.engineeringRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.ENGINEERING),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PROCUREMENT).path,
    loadChildren: () =>
      import("./pages/procurement/procurement.routes").then(
        (m) => m.procurementRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.PROCUREMENT),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.APPROVAL).path,
    loadChildren: () =>
      import("./pages/management/management.routes").then(
        (m) => m.managementRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.APPROVAL),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.PLANNING).path,
    loadChildren: () =>
      import("./pages/planning/planning.routes").then((m) => m.planningRoutes),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.PLANNING),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.INDICATORS).path,
    loadChildren: () =>
      import("./pages/indicators/indicators.routes").then(
        (m) => m.indicatorsRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.INDICATORS),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.REPORT).path,
    loadChildren: () =>
      import("./pages/report/report.routes").then((m) => m.reportRoutes),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.REPORT),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.BOM_CONFIGURATIONS).path,
    loadChildren: () =>
      import("./pages/bom-configurations/bom-configurations.routes").then(
        (m) => m.bomConfigurationsRoutes,
      ),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.BOM_CONFIGURATIONS),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN).path,
    loadChildren: () =>
      import("./pages/admin/admin.routes").then((m) => m.adminRoutes),
    canActivate: [
      () => inject(AuthGuardService).canActivate(),
      () => inject(RoleGuard).canActivate(RouteId.ADMIN),
    ],
  },
  // WILDCARD: MUST BE LAST ROUTE IN THE LIST
  {
    path: "**",
    redirectTo: RoutingService.getRouteEnv(RouteId.LOGIN).path,
  },
];
