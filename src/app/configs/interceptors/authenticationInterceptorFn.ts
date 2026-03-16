import { HttpInterceptorFn } from '@angular/common/http';
import { AuthenticationService } from '../../security/authentication.service';
import { inject } from '@angular/core';

export const authenticationInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthenticationService);
  const authToken = authService.getToken();

  if (authToken) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    // Pass the cloned request with the updated header to the next handler
    return next(authReq);
  } else {
    return next(req);
  }
};
