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
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { Icons } from "../../../models/enums/icons";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { QueryParamKey } from "../../../models/enums/queryParamKey";
import { UserResetPassword } from "../../../../client/npiSeiko";

@Component({
  selector: "app-set-first-password",
  imports: [
    CardModule,
    InputTextModule,
    FormsModule,
    ButtonModule,
    ReactiveFormsModule,
    MessageModule,
    RippleModule,
    RouterLink,
  ],
  providers: [],
  templateUrl: "./set-first-password.component.html",
  styleUrl: "./set-first-password.component.scss",
})
export class SetFirstPasswordComponent implements OnInit, OnDestroy {
  token: string | null = "";
  passwordType = "password";
  repeatPasswordType = "password";

  $destroyed = new Subject<void>();
  userSetFirstPasswordForm = new FormGroup({
    password: new FormControl("", [Validators.required]),
    repeatPassword: new FormControl("", [Validators.required]),
  });
  protected readonly Icons = Icons;

  constructor(
    private readonly userRepo: UserRepo,
    private readonly authService: AuthenticationService,
    private readonly router: Router,
    private readonly handleMessage: HandleToastMessageService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get(QueryParamKey.TOKEN);
  }

  ngOnDestroy(): void {
    this.$destroyed.next();
    this.$destroyed.complete();
  }

  changePasswordInputType(): void {
    this.passwordType = this.passwordType === "password" ? "text" : "password";
  }

  changeRepeatPasswordInputType(): void {
    this.repeatPasswordType =
      this.repeatPasswordType === "password" ? "text" : "password";
  }

  onSubmit() {
    if (
      this.userSetFirstPasswordForm.value.password !==
      this.userSetFirstPasswordForm.value.repeatPassword
    ) {
      this.handleMessage.warningMessage("The provided passwords must match");
    } else {
      const userSetFirstPassword: UserResetPassword = {
        token: this.token!!,
        password: this.userSetFirstPasswordForm.value.password!!,
      };
      this.userRepo
        .setFirstPassword(userSetFirstPassword)
        .pipe(takeUntil(this.$destroyed))
        .subscribe({
          next: () => {
            this.handleMessage.successMessage("Password set");
            this.router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)]);
          },
        });
    }
  }
}
