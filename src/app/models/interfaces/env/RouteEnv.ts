import { RouteId } from '../../enums/routes-id';

export interface RouteEnv {
  id: RouteId;
  path: string;
  enable: boolean;
  isPrincipal?: boolean;
  children?: RouteEnv[];
  title?: string;
  detailBackLink?: RouteId;
  // params?: { [key: any]: any };
}
