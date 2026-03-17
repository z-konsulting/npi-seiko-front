import {
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { SharedModule } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { MenubarModule } from "primeng/menubar";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { AuthenticationService } from "../../security/authentication.service";
import { AsyncPipe } from "@angular/common";
import { filter, Observable } from "rxjs";
import { Icons } from "../../models/enums/icons";
import { HandleNavBar, NavBarItem } from "../../models/classes/HandleNavBar";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { RouteEnv } from "../../models/interfaces/env/RouteEnv";
import { environment } from "../../../environments/environment";
import { UserRepo } from "../../repositories/user.repo";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UserRole } from "../../../client/npiSeiko";
import { NoDoubleClickDirective } from "../../directives/no-double-click.directive";

@Component({
  selector: "app-nav-bar",
  imports: [
    ButtonModule,
    MenubarModule,
    SharedModule,
    AsyncPipe,
    RouterLink,
    NoDoubleClickDirective,
  ],
  templateUrl: "./nav-bar.component.html",
  styleUrl: "./nav-bar.component.scss",
})
export class NavBarComponent implements OnInit {
  items: NavBarItem[] = [];
  isAuthenticated$: Observable<boolean>;
  userRole!: UserRole;
  readonly isScrolled = signal<boolean>(false);
  protected readonly Icons = Icons;
  protected readonly RoutingService = RoutingService;
  protected readonly RouteId = RouteId;
  protected authService = inject(AuthenticationService);
  protected userRepo = inject(UserRepo);
  protected handleMessage = inject(HandleToastMessageService);
  protected destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  constructor() {
    this.isAuthenticated$ = this.authService.authStatus$;
  }

  @HostListener("window:scroll")
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 10);
  }

  ngOnInit() {
    this.isAuthenticated$.subscribe((isAuthenticated) => {
      this.items = [];
      this.userRole = this.authService.getRole() ?? UserRole.ADMINISTRATOR;
      if (isAuthenticated) {
        RoutingService.getAllPrincipalsRoute().forEach((route: RouteEnv) => {
          const nav: HandleNavBar = new HandleNavBar(
            RoutingService.getRouteEnv(route.id),
            isAuthenticated,
            this.userRole,
          );
          this.items.push(nav.navBarItem);
        });
        this.initActiveRoute();
      }
    });
  }

  isPrincipal(routeId: string): boolean {
    return RoutingService.getRouteEnv(parseInt(routeId)).isPrincipal ?? false;
  }

  logout() {
    this.userRepo
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.authService.storeUserLogged("false");
          this.router.navigate([
            RoutingService.getRouteEnv(RouteId.LOGIN).path,
          ]);
        },
      });
  }

  initActiveRoute() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects.split("/")[1];
        environment.routes.forEach((route) => {
          if (route.path === path) {
            this.updatedActiveItem(route.id.toString());
          }
        });
      });
  }

  updatedActiveItem(itemClickedId: string) {
    this.items?.forEach((item: NavBarItem) => {
      item.active = itemClickedId === item.id;
    });
  }
}
