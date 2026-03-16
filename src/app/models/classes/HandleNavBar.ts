import { RouteEnv } from '../interfaces/env/RouteEnv';
import { AccessService } from '../../services/Access.service';
import { MenuItem } from 'primeng/api';
import { UserRole } from '../../../client/costSeiko';

export interface NavBarItem extends MenuItem {
  items: NavBarItem[];
  active: boolean;
}

export class HandleNavBar {
  navBarItem: NavBarItem;
  isAuthenticated: boolean;
  role: UserRole;

  constructor(routeEnv: RouteEnv, isAuthenticated: boolean, role: UserRole) {
    if (routeEnv.isPrincipal) {
      this.isAuthenticated = isAuthenticated;
      this.role = role;
      this.navBarItem = this.mappedToNavBarItem(routeEnv);
    } else {
      throw "HandleService : routeId isn't a principal route";
    }
  }

  private getAllItems(routesEnv: RouteEnv[], pathRoute: string): NavBarItem[] {
    return routesEnv.map((routeEnv: RouteEnv) =>
      this.mappedToNavBarItem(routeEnv, pathRoute),
    );
  }

  private mappedToNavBarItem(
    routeEnv: RouteEnv,
    backPathRoute?: string,
  ): NavBarItem {
    const routerLink =
      (backPathRoute ? backPathRoute : '') + '/' + routeEnv.path;
    const visible =
      routeEnv.enable &&
      this.isAuthenticated &&
      AccessService.canAccess(routeEnv.id, this.role);
    const hasChildren =
      routeEnv.children &&
      routeEnv.children.length > 0 &&
      routeEnv.children.some((child) => child.enable);
    return {
      id: routeEnv.id.toString(),
      label: `${routeEnv.title}`,
      title: `${routeEnv.title}`,
      routerLink: routerLink,
      visible: visible,
      items: hasChildren
        ? this.getAllItems(routeEnv.children!, routerLink)
        : [],

      active: false,
    };
  }
}
