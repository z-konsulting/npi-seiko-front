import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { RoutingService } from '../../services/Routing.service';
import { RouteId } from '../../models/enums/routes-id';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../security/authentication.service';
import { Tab, TabList, Tabs } from 'primeng/tabs';

@Component({
  selector: 'app-custom-tab-view',
  imports: [Tabs, TabList, Tab],
  templateUrl: './custom-tab-view.component.html',
  styleUrl: './custom-tab-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTabViewComponent implements OnInit {
  tabsToDisplay = input.required<RouteId[]>();
  tabBadges = input<Partial<Record<RouteId, number | string>>>({});
  indexSelected: number = 0;
  protected readonly RoutingService = RoutingService;

  private readonly router = inject(Router);
  private activeRouter = inject(ActivatedRoute);
  private authService = inject(AuthenticationService);

  ngOnInit() {
    this.initIndex();
  }

  onchangeTabView(routeIdClicked: any) {
    this.router.navigate([RoutingService.fullPathRoute(routeIdClicked)]);
  }

  initIndex() {
    const currentPath = RoutingService.getLastChildPath(
      this.activeRouter.snapshot,
    );
    const tabs = this.tabsToDisplay();

    // Find the index corresponding to the current path
    this.indexSelected = tabs.findIndex(
      (route) => RoutingService.getRouteEnv(route).path === currentPath,
    );

    // If no index found, select the first tab
    if (this.indexSelected === -1) {
      this.indexSelected = 0;
    }
  }
}
