import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Dashboard2 as DashboardSDK, Dashboard } from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class DashboardRepo {
  private dashboardService = inject(DashboardSDK);

  getDashboard(): Observable<Dashboard> {
    return fromRequest(this.dashboardService.retrieveDashboard());
  }
}
