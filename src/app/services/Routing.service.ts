import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { RouteId } from '../models/enums/routes-id';
import { RouteEnv } from '../models/interfaces/env/RouteEnv';
import { ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  constructor() {}

  public static getRouteEnv(routeId: RouteId): RouteEnv {
    return (
      this.searchPathRoute(environment.routes, routeId) ?? environment.routes[0]
    );
  }

  public static getRouteTitle(routeId: RouteId): string {
    return RoutingService.getRouteEnv(routeId).title!;
  }

  public static getAllPrincipalsRoute(): RouteEnv[] {
    return environment.routes.filter((route) => route.isPrincipal);
  }

  public static fullPathRoute(routeId: RouteId): string | null {
    return this.searchFullPath(environment.routes, routeId);
  }

  public static getFullPath(routeId: RouteId): string {
    return this.fullPathRoute(routeId) ?? '/';
  }

  public static getLastChildPath(
    activateRoute: ActivatedRouteSnapshot,
  ): string {
    if (activateRoute.firstChild) {
      return RoutingService.getLastChildPath(activateRoute.firstChild);
    }
    return activateRoute.routeConfig?.path ?? '';
  }

  private static searchPathRoute(
    routesEnv: RouteEnv[],
    routeId: RouteId,
  ): RouteEnv | null {
    for (let route of routesEnv) {
      if (route.id === routeId) {
        return route;
      }
      if (route.children && route.children.length > 0) {
        const found = this.searchPathRoute(route.children, routeId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private static searchFullPath(
    routesEnv: RouteEnv[],
    routeId: RouteId,
    currentPath?: string,
  ): string | null {
    const currentPathValue = currentPath ? `/${currentPath}` : '';
    for (let route of routesEnv) {
      if (route.id === routeId) {
        return `${route.path}${currentPathValue}`;
      }
      if (route.children && route.children.length > 0) {
        const found = this.searchPathRoute(route.children, routeId);
        if (found) {
          if (found.detailBackLink) {
            return this.searchFullPath(
              routesEnv,
              found.detailBackLink,
              `${found.path}${currentPathValue}`,
            );
          } else {
            return `${found.path}${currentPathValue}`;
          }
        }
      }
    }
    return null;
  }
}
