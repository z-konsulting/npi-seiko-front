import { Component, signal } from "@angular/core";
import { Card } from "primeng/card";
import { CustomTitleComponent } from "../../../../components/custom-title/custom-title.component";
import { PrimeTemplate } from "primeng/api";
import { RoutingService } from "../../../../services/Routing.service";
import { RouteId } from "../../../../models/enums/routes-id";
import { MaterialStatus, MaterialType } from "../../../../../client/costSeiko";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { MaterialsListComponent } from "../materials-list/materials-list.component";

@Component({
  selector: "app-materials-to-estimated",
  imports: [
    Card,
    CustomTitleComponent,
    PrimeTemplate,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    MaterialsListComponent,
  ],
  templateUrl: "./materials-to-estimated.component.html",
  styleUrl: "./materials-to-estimated.component.scss",
})
export class MaterialsToEstimatedComponent {
  title = RoutingService.getRouteTitle(RouteId.MATERIALS_TO_ESTIMATE);
  tabIndex = signal<number>(0);
  directCount = signal<number | null>(null);
  indirectCount = signal<number | null>(null);
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;

  onTabChange($event: string | number | undefined): void {
    this.tabIndex.set(Number($event ?? 0));
  }
}
