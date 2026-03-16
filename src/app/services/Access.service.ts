import { Injectable } from "@angular/core";
import { RouteId } from "../models/enums/routes-id";
import { UserRole } from "../../client/costSeiko";

/**
 * Single source of truth for role-based access control.
 * Defines which roles can access each route section.
 * Used by both RoleGuard (route protection) and HandleNavBar (nav visibility).
 */
const ROUTE_ROLES: Partial<Record<RouteId, UserRole[]>> = {
  // ADMIN: list every role that can enter the section.
  // Sub-routes below further restrict access per page.
  // PROCUREMENT can only reach Manufacturing, Units, and Material Categories.
  [RouteId.ADMIN]: [UserRole.ADMINISTRATOR, UserRole.PROCUREMENT],

  // Admin sub-route guards (applied in admin.routes.ts via canActivate).
  // Omitting an entry = accessible to anyone who passed the parent guard.
  [RouteId.ADMIN_USERS]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_CUSTOMERS]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_PRODUCT_NAMES]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_CURRENCIES]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_PROCESSES]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_SHIPMENT_METHODS]: [UserRole.ADMINISTRATOR],
  [RouteId.ADMIN_GLOBAL_CONFIG]: [UserRole.ADMINISTRATOR],
  // ADMIN_MATERIAL_CATEGORIES, ADMIN_UNITS, ADMIN_SUPPLIERS_MANUFACTURERS:
  // no entry = accessible to all authenticated users who passed the parent guard.
  [RouteId.BOM_CONFIGURATIONS]: [
    UserRole.PROJECT_MANAGER,
    UserRole.ENGINEERING,
    UserRole.ADMINISTRATOR,
  ],
  [RouteId.COST_REQUEST]: [UserRole.PROJECT_MANAGER],
  [RouteId.QUOTATION]: [UserRole.PROJECT_MANAGER],
  [RouteId.ENGINEERING]: [UserRole.ENGINEERING],

  // PROCUREMENT: list every role that can enter the section.
  // Sub-routes below further restrict access per page.
  // Example: ENGINEERING can only reach PROCUREMENT_COST_REQUEST_LINE.
  [RouteId.PROCUREMENT]: [UserRole.PROCUREMENT /*, UserRole.ENGINEERING */],

  // Sub-route guards (applied in procurement.routes.ts via canActivate).
  // Omitting an entry = accessible to anyone who passed the parent guard.
  // [RouteId.PROCUREMENT_MATERIAL]: [UserRole.PROJECT_MANAGER],
  // [RouteId.PROCUREMENT_TOOLING]: [UserRole.PROJECT_MANAGER],
  // [RouteId.PROCUREMENT_COST_REQUEST_LINE]: [UserRole.PROJECT_MANAGER /*, UserRole.ENGINEERING */],

  [RouteId.APPROVAL]: [UserRole.MANAGEMENT],
  [RouteId.DASHBOARD]: [
    UserRole.PROJECT_MANAGER,
    UserRole.ENGINEERING,
    UserRole.MANAGEMENT,
    UserRole.PROCUREMENT,
  ],
  [RouteId.PLANNING]: [UserRole.PLANNING],
  [RouteId.INDICATORS]: [
    UserRole.ENGINEERING,
    UserRole.MANAGEMENT,
    UserRole.PROJECT_MANAGER,
    UserRole.PROCUREMENT,
  ],
  [RouteId.REPORT]: [
    UserRole.PROJECT_MANAGER,
    UserRole.ENGINEERING,
    UserRole.MANAGEMENT,
  ],
};

@Injectable({
  providedIn: "root",
})
export class AccessService {
  /**
   * Returns true if the given role can access the given route.
   * SUPER_ADMINISTRATOR and ADMINISTRATOR always have full access.
   * Routes not listed in ROUTE_ROLES are accessible to all authenticated users.
   */
  public static canAccess(routeId: RouteId, role: UserRole): boolean {
    if (this.isSuperAdmin(role) || this.isAdministrator(role)) return true;
    const allowedRoles = ROUTE_ROLES[routeId];
    if (allowedRoles == null) return true;
    return allowedRoles.includes(role);
  }

  public static isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMINISTRATOR;
  }

  public static isAdministrator(role: UserRole): boolean {
    return role === UserRole.ADMINISTRATOR;
  }

  /**
   * Returns the home route for the given role.
   * Used to redirect unauthorized users to the correct page.
   */
  public static getHomeRouteId(role: UserRole): RouteId {
    if (this.isSuperAdmin(role) || this.isAdministrator(role))
      return RouteId.COST_REQUEST;
    const homeRoutes: Partial<Record<UserRole, RouteId>> = {
      [UserRole.PROJECT_MANAGER]: RouteId.COST_REQUEST,
      [UserRole.ENGINEERING]: RouteId.ENGINEERING,
      [UserRole.MANAGEMENT]: RouteId.APPROVAL,
      [UserRole.PROCUREMENT]: RouteId.PROCUREMENT,
      [UserRole.PLANNING]: RouteId.PLANNING,
    };
    return homeRoutes[role] ?? RouteId.COST_REQUEST;
  }
}
