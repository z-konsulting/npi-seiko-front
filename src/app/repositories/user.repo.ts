import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import {
  ActiveFilter,
  LoginDetails,
  Public,
  User,
  User2,
  UserForgotPassword,
  UserResetPassword,
  UserRole,
  UsersPaginated,
  UserUsernameResetPassword,
  UserWithEmailCreate,
  UserWithEmailUpdate,
  UserWithUsernameCreate,
  UserWithUsernameUpdate,
} from "../../client/npiSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class UserRepo {
  private readonly public = `${environment.backendUrl}/public`;
  private readonly users = `${environment.backendUrl}/users`;

  constructor(
    private http: HttpClient,
    private publicService: Public,
    private userService: User2,
  ) {}

  login(userLogin: LoginDetails) {
    return fromRequest(this.publicService.loginUser({ body: userLogin }));
  }

  logout() {
    return fromRequest(this.userService.logoutUser());
  }

  forgotPassword(userForgotPassword: UserForgotPassword): Observable<any> {
    return fromRequest(
      this.publicService.forgotPasswordUser({
        body: userForgotPassword,
      }),
    );
  }

  resetPassword(userResetPassword: UserResetPassword): Observable<any> {
    return fromRequest(
      this.publicService.resetPasswordUser({
        body: userResetPassword,
      }),
    );
  }

  setFirstPassword(userResetPassword: UserResetPassword): Observable<any> {
    return fromRequest(
      this.publicService.setFirstPasswordUser({
        body: userResetPassword,
      }),
    );
  }

  searchUsers(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
    activeFilter?: ActiveFilter | undefined,
  ): Observable<UsersPaginated> {
    return fromRequest(
      this.userService.searchUsers({
        body: {
          searchText: search ?? "",
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
          activeFilter: activeFilter ?? "ALL",
        },
      }),
    );
  }

  getUser(userId: string): Observable<User> {
    return fromRequest(
      this.userService.retrieveUser({
        path: {
          uid: userId,
        },
      }),
    );
  }

  resendUserEmailForCreation(userId: string): Observable<any> {
    return fromRequest(
      this.userService.resendUserCreationEmail({
        path: {
          uid: userId,
        },
      }),
    );
  }

  createUserWithEmail(email: string, role: UserRole) {
    const body: UserWithEmailCreate = {
      email: email,
      role: role,
    };
    return fromRequest(
      this.userService.createUserEmail({
        body: body,
      }),
    );
  }

  createUserWithUsername(username: string, password: string, role: UserRole) {
    const body: UserWithUsernameCreate = {
      username: username,
      password: password,
      role: role,
    };
    return fromRequest(
      this.userService.createUserUsername({
        body: body,
      }),
    );
  }

  updateUserWithEmail(userId: string, role: UserRole): Observable<User> {
    const body: UserWithEmailUpdate = {
      role: role,
    };
    return fromRequest(
      this.userService.updateUserWithEmail({
        body: body,
        path: {
          uid: userId,
        },
      }),
    );
  }

  updateUserWithUsername(userId: string, role: UserRole): Observable<User> {
    const body: UserWithUsernameUpdate = {
      role: role,
    };
    return fromRequest(
      this.userService.updateUserWithUsername({
        body: body,
        path: {
          uid: userId,
        },
      }),
    );
  }

  updateUserPassword(userId: string, password: string) {
    const body: UserUsernameResetPassword = {
      password: password,
    };
    return fromRequest(
      this.userService.updateUserPassword({
        body: body,
        path: {
          uid: userId,
        },
      }),
    );
  }

  manageUserActivation(userId: string, activate: boolean): Observable<any> {
    if (activate) {
      return fromRequest(
        this.userService.activateUser({
          path: {
            uid: userId,
          },
        }),
      );
    } else {
      return fromRequest(
        this.userService.deactivateUser({
          path: {
            uid: userId,
          },
        }),
      );
    }
  }

  checkLicenseValidity(): Observable<boolean> {
    return fromRequest(this.userService.checkLicenseValidity({}));
  }
}
