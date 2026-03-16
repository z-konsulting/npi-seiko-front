import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { DatePipe } from "@angular/common";
import { CardModule } from "primeng/card";
import { SkeletonModule } from "primeng/skeleton";
import { CostRequest, Dashboard } from "../../../client/costSeiko";
import { DashboardRepo } from "../../repositories/dashboard.repo";
import { KpiCardsComponent } from "./components/kpi-cards/kpi-cards.component";
import { StatusBarChartComponent } from "./components/status-bar-chart/status-bar-chart.component";
import { WorstLeadTimeTableComponent } from "./components/worst-lead-time-table/worst-lead-time-table.component";
import { EngineerBacklogComponent } from "./components/engineer-backlog/engineer-backlog.component";
import { ProcurementBacklogComponent } from "./components/procurement-backlog/procurement-backlog.component";
import { ManagementBacklogComponent } from "./components/management-backlog/management-backlog.component";
import { TopClientsTableComponent } from "./components/top-clients-table/top-clients-table.component";
import { AtRiskSidebarComponent } from "./components/at-risk-sidebar/at-risk-sidebar.component";
import { CustomTitleComponent } from "../../components/custom-title/custom-title.component";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { Icons } from "../../models/enums/icons";

@Component({
  selector: "app-dashboard",
  imports: [
    DatePipe,
    CardModule,
    SkeletonModule,
    KpiCardsComponent,
    StatusBarChartComponent,
    WorstLeadTimeTableComponent,
    EngineerBacklogComponent,
    ProcurementBacklogComponent,
    ManagementBacklogComponent,
    TopClientsTableComponent,
    AtRiskSidebarComponent,
    CustomTitleComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  title = RoutingService.getRouteTitle(RouteId.DASHBOARD);
  loading = signal<boolean>(false);
  dashboard = signal<Dashboard | undefined>(undefined);
  atRiskSidebarVisible = signal<boolean>(false);
  expiredSidebarVisible = signal<boolean>(false);
  lastRefreshedAt = signal<Date | undefined>(undefined);

  atRiskCostRequests = computed<CostRequest[]>(
    () => this.dashboard()?.globalKpis?.costRequestsAtRisk ?? [],
  );
  expiredCostRequests = computed<CostRequest[]>(
    () => this.dashboard()?.globalKpis?.expiredCostRequest ?? [],
  );

  protected readonly Icons = Icons;
  private dashboardRepo = inject(DashboardRepo);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadDashboard();
  }

  openAtRiskSidebar(): void {
    this.atRiskSidebarVisible.set(true);
  }

  openExpiredSidebar(): void {
    this.expiredSidebarVisible.set(true);
  }

  refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.dashboardRepo
      .getDashboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(() => {
            this.loading.set(false);
          }, 1000);
        }),
      )
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.lastRefreshedAt.set(new Date());
        },
      });
  }
}
