import { Component, OnDestroy, OnInit } from "@angular/core";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { UserRepo } from "../../../repositories/user.repo";
import { Subject, takeUntil } from "rxjs";
import { MessageModule } from "primeng/message";
import { RippleModule } from "primeng/ripple";
import { AuthenticationService } from "../../../security/authentication.service";
import { Router, RouterLink } from "@angular/router";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { Icons } from "../../../models/enums/icons";
import { UserFormField } from "../../../models/enums/form-field-names/user-form-field";
import { PasswordModule } from "primeng/password";
import { RoutingService } from "../../../services/Routing.service";
import { LoggedUser, LoginDetails } from "../../../../client/costSeiko";
import { StateParamKey } from "../../../models/enums/stateParamKey";
import { AccessService } from "../../../services/Access.service";

@Component({
  selector: "app-login",
  imports: [
    CardModule,
    InputTextModule,
    FormsModule,
    ButtonModule,
    ReactiveFormsModule,
    MessageModule,
    RippleModule,
    RouterLink,
    PasswordModule,
  ],
  providers: [],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent implements OnInit, OnDestroy {
  userLoginDetails: LoginDetails = {
    login: "",
    password: "",
  };
  passwordType = "password";
  $destroyed = new Subject<void>();
  userLoginForm = new FormGroup({
    login: new FormControl("", [Validators.required]),
    password: new FormControl("", Validators.required),
  });
  disconnected = false;

  protected readonly Icons = Icons;
  protected readonly UserFormFieldName = UserFormField;

  constructor(
    private readonly userRepo: UserRepo,
    private readonly authService: AuthenticationService,
    private readonly router: Router,
    private readonly handleMessage: HandleToastMessageService,
  ) {}

  get userLogin() {
    return this.userLoginForm.value.login;
  }

  get userPassword() {
    return this.userLoginForm.value.password;
  }

  ngOnInit(): void {
    this.checkIfDisconnected();
  }

  checkIfDisconnected() {
    const state = window.history.state;
    if (state) {
      this.disconnected = !!state[StateParamKey.DISCONNECTED];
      const cleanState = { ...state };
      delete cleanState[StateParamKey.DISCONNECTED];
      delete cleanState[StateParamKey.REASON];
      window.history.replaceState(cleanState, "");
    }
  }

  ngOnDestroy(): void {
    this.$destroyed.next();
    this.$destroyed.complete();
  }

  changeInputType(): void {
    this.passwordType = this.passwordType === "password" ? "text" : "password";
  }

  onSubmit() {
    this.userLoginDetails.login = this.userLogin ?? "";
    this.userLoginDetails.password = this.userPassword ?? "";
    this.userRepo
      .login(this.userLoginDetails)
      .pipe(takeUntil(this.$destroyed))
      .subscribe({
        next: (loggedUser: LoggedUser) => {
          this.storeUserValues(loggedUser);
          switch (loggedUser.role) {
            default: {
              this.router.navigate([
                RoutingService.fullPathRoute(
                  AccessService.getHomeRouteId(loggedUser.role),
                ),
              ]);
            }
          }
        },
      });
  }

  private storeUserValues(loggedUser: LoggedUser) {
    this.authService.storeUserLogged("true");
    this.authService.storeToken(loggedUser.jwtToken);
    this.authService.storeRole(loggedUser.role);
    this.authService.storeLogin(loggedUser.login);
    this.authService.storeUserId(loggedUser.uid);
  }
}
