import { Component } from "@angular/core";
import { Card } from "primeng/card";
import { CustomTabViewComponent } from "../../../components/custom-tab-view/custom-tab-view.component";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { PrimeTemplate } from "primeng/api";
import { RouterOutlet } from "@angular/router";
import { RouteId } from "../../../models/enums/routes-id";
import { RoutingService } from "../../../services/Routing.service";

@Component({
  selector: "app-cost-indicators",
  imports: [
    Card,
    CustomTabViewComponent,
    CustomTitleComponent,
    PrimeTemplate,
    RouterOutlet,
  ],
  templateUrl: "./cost-indicators.component.html",
  styleUrl: "./cost-indicators.component.scss",
})
export class CostIndicatorsComponent {
  routeIds: RouteId[] = [
    RouteId.COST_REQUESTS_MONTHLY_ACTIVE,
    RouteId.COST_REQUESTS_MONTHLY_ACTIVE_LEAD_TIME,
  ];
  title = RoutingService.getRouteEnv(RouteId.INDICATORS).title ?? "";
}
