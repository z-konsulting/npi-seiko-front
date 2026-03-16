import { Component, inject, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MenubarModule } from "primeng/menubar";
import { ButtonModule } from "primeng/button";
import { NavBarComponent } from "./components/nav-bar/nav-bar.component";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { CustomLoaderComponent } from "./components/custom-loader/custom-loader.component";
import { PrimeNG } from "primeng/config";
import { AuthenticationService } from "./security/authentication.service";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    MenubarModule,
    ButtonModule,
    NavBarComponent,
    ToastModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    CustomLoaderComponent,
  ],
  providers: [],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  isConnected = signal<boolean>(false);
  private authService = inject(AuthenticationService);

  constructor(private primengConfig: PrimeNG) {
    this.authService.authStatus$.subscribe((isAuthenticated) => {
      this.isConnected.set(isAuthenticated);
    });
  }

  reloadApp() {
    const channel = new BroadcastChannel("app_channel");
    channel.postMessage("reload");
  }
}
