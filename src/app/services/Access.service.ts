import { Injectable } from "@angular/core";
import { RouteId } from "../models/enums/routes-id";
import { UserRole } from "../../client/npiSeiko";

/**
 * Single source of truth for role-based access control.
 * Defines which roles can access each route section.
 * Used by both RoleGuard (route protection) and HandleNavBar (nav visibility).
 */
const ROUTE_ROLES: Partial<Record<RouteId, UserRole[]>> = {
  // ADMIN: list every role that can enter the section.
  // Sub-routes below further restrict access per page.
  // PROCUREMENT can only reach Manufacturing, Units, and Material Categories.
  [RouteId.ADMIN]: [UserRole.ADMINISTRATOR],

  // Admin sub-route guards (applied in admin.routes.ts via canActivate).
  // Omitting an entry = accessible to anyone who passed the parent guard.
  [RouteId.DASHBOARD]: [UserRole.ENGINEERING, UserRole.PROCUREMENT],
  [RouteId.NPI_ORDERS]: [UserRole.ENGINEERING, UserRole.PROCUREMENT],
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
    if (allowedRoles == null || allowedRoles.length === 0) return true;
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
      return RouteId.DASHBOARD;
    return RouteId.DASHBOARD;
  }
}
