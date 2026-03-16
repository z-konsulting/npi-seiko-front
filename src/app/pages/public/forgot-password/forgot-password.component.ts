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
import { environment } from "../../../../environments/environment";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { UserForgotPassword } from "../../../../client/costSeiko";

@Component({
  selector: "app-forgot-password",
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
  templateUrl: "./forgot-password.component.html",
  styleUrl: "./forgot-password.component.scss",
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  userForgotPassword: UserForgotPassword = {
    email: "",
  };
  $destroyed = new Subject<void>();
  userForgotPasswordForm = new FormGroup({
    email: new FormControl(environment.email, [
      Validators.email,
      Validators.required,
    ]),
  });
  protected readonly Icons = Icons;

  constructor(
    private readonly userRepo: UserRepo,
    private readonly authService: AuthenticationService,
    private readonly router: Router,
    private readonly handleMessage: HandleToastMessageService,
  ) {}

  get userEmail() {
    return this.userForgotPasswordForm.value.email;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.$destroyed.next();
    this.$destroyed.complete();
  }

  onSubmit() {
    this.userForgotPassword.email = this.userEmail ?? "";
    this.userRepo
      .forgotPassword(this.userForgotPassword)
      .pipe(takeUntil(this.$destroyed))
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Your request has been sent");
          this.router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)]);
        },
      });
  }
}
