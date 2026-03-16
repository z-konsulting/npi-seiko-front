import { inject } from "@angular/core";
import { Routes } from "@angular/router";

import { RouteId } from "../../models/enums/routes-id";
import { RoutingService } from "../../services/Routing.service";
import { RoleGuard } from "../../security/role.guard";
import { AuthenticationService } from "../../security/authentication.service";
import { AccessService } from "../../services/Access.service";
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminCustomersComponent } from "./admin-customers/admin-customers.component";
import { AdminProductNamesComponent } from "./admin-product-names/admin-product-names.component";
import { AdminMaterialCategoriesComponent } from "./admin-material-categories/admin-material-categories.component";
import { AdminCurrenciesComponent } from "./admin-currencies/admin-currencies.component";
import { AdminProcessesComponent } from "./admin-processes/admin-processes.component";
import { AdminShipmentMethodsComponent } from "./admin-shipment-methods/admin-shipment-methods.component";
import { AdminGlobalConfigComponent } from "./admin-global-config/admin-global-config.component";
import { AdminUnitsComponent } from "./admin-units/admin-units.component";
import { AdminSuppliersManufacturersComponent } from "./admin-suppliers-manufacturers/admin-suppliers-manufacturers.component";
import { AdminShipmentLocationsComponent } from "./admin-shipment-locations/admin-shipment-locations.component";

export const adminRoutes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: () => {
      const role = inject(AuthenticationService).getRole();
      if (role && !AccessService.canAccess(RouteId.ADMIN_USERS, role)) {
        return RoutingService.getRouteEnv(RouteId.ADMIN_SUPPLIERS_MANUFACTURERS)
          .path;
      }
      return RoutingService.getRouteEnv(RouteId.ADMIN_USERS).path;
    },
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_USERS).path,
    component: AdminUsersComponent,
    canActivate: [() => inject(RoleGuard).canActivate(RouteId.ADMIN_USERS)],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_CUSTOMERS).path,
    component: AdminCustomersComponent,
    canActivate: [() => inject(RoleGuard).canActivate(RouteId.ADMIN_CUSTOMERS)],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_PRODUCT_NAMES).path,
    component: AdminProductNamesComponent,
    canActivate: [
      () => inject(RoleGuard).canActivate(RouteId.ADMIN_PRODUCT_NAMES),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_MATERIAL_CATEGORIES).path,
    component: AdminMaterialCategoriesComponent,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_CURRENCIES).path,
    component: AdminCurrenciesComponent,
    canActivate: [
      () => inject(RoleGuard).canActivate(RouteId.ADMIN_CURRENCIES),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_PROCESSES).path,
    component: AdminProcessesComponent,
    canActivate: [() => inject(RoleGuard).canActivate(RouteId.ADMIN_PROCESSES)],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_SHIPMENT_METHODS).path,
    component: AdminShipmentMethodsComponent,
    canActivate: [
      () => inject(RoleGuard).canActivate(RouteId.ADMIN_SHIPMENT_METHODS),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_UNITS).path,
    component: AdminUnitsComponent,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_SUPPLIERS_MANUFACTURERS)
      .path,
    component: AdminSuppliersManufacturersComponent,
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_GLOBAL_CONFIG).path,
    component: AdminGlobalConfigComponent,
    canActivate: [
      () => inject(RoleGuard).canActivate(RouteId.ADMIN_GLOBAL_CONFIG),
    ],
  },
  {
    path: RoutingService.getRouteEnv(RouteId.ADMIN_SHIPMENT_LOCATIONS).path,
    component: AdminShipmentLocationsComponent,
  },
];
