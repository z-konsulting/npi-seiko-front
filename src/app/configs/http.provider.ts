import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authenticationInterceptorFn } from './interceptors/authenticationInterceptorFn';
import { handleErrorRequestInterceptorFn } from './interceptors/handle-error-request-interceptor.fn';

export const provideHttpCore = () => [
  provideHttpClient(
    withInterceptors([
      authenticationInterceptorFn,
      handleErrorRequestInterceptorFn,
    ]),
  ),
];
