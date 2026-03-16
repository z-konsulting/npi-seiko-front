import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../../client/costSeiko';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  // Allow to follow the authentication status
  private authStatus = new BehaviorSubject<boolean>(this.isUserLogged());
  authStatus$ = this.authStatus.asObservable();

  constructor() {
    window.addEventListener('storage', (e) => {
      const allKeys = [
        environment.userLogged,
        environment.userTokenKey,
        environment.userRole,
        environment.userLoginKey,
        environment.userId,
        environment.userAllowedCapacities,
      ];
      if (e.key && allKeys.includes(e.key)) {
        window.location.reload();
      }
    });
  }

  storeUserLogged(isLogged: string) {
    localStorage.setItem(environment.userLogged, isLogged);
    this.authStatus.next(this.isUserLogged());
  }

  // Store JWT token in session storage
  storeToken(token: string) {
    localStorage.setItem(environment.userTokenKey, token);
    this.authStatus.next(this.isUserLogged());
  }

  // Store login in session storage
  storeLogin(login: string) {
    localStorage.setItem(environment.userLoginKey, login);
    this.authStatus.next(this.isUserLogged());
  }

  storeRole(role: UserRole) {
    localStorage.setItem(environment.userRole, role);
    this.authStatus.next(this.isUserLogged());
  }

  storeUserId(userId: string) {
    localStorage.setItem(environment.userId, userId);
    this.authStatus.next(this.isUserLogged());
  }

  // Retrieve user uid
  getUserId(): string | null {
    return localStorage.getItem(environment.userId);
  }

  // Retrieve JWT token from session storage
  getToken(): string | null {
    return localStorage.getItem(environment.userTokenKey);
  }

  // Retrieve login from session storage
  getLogin(): string | null {
    return localStorage.getItem(environment.userLoginKey);
  }

  getRole(): UserRole | null {
    const value = localStorage.getItem(environment.userRole);
    return value ? (value as UserRole) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authStatus.getValue();
  }

  getUserLogged(): boolean {
    const value = localStorage.getItem(environment.userLogged);
    return value === 'true';
  }

  // Clear session storage (on logout for example)
  clearSession() {
    localStorage.clear();
    this.authStatus.next(this.isUserLogged());
  }

  private isUserLogged(): boolean {
    return this.getUserLogged();
  }
}
