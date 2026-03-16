import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HandleToastMessageService } from '../services/handle-toast-message.service';
import { RoutingService } from '../services/Routing.service';
import { RouteId } from '../models/enums/routes-id';
import { QueryParamKey } from '../models/enums/queryParamKey';

export const tokenResolver: ResolveFn<string> = (route, state) => {
  const token = route.queryParamMap.get(QueryParamKey.TOKEN);
  const handleMessageService = inject(HandleToastMessageService);
  const router = inject(Router);
  if (!token || token.trim() === '') {
    handleMessageService.errorMessage(
      'Url invalid: Please verify the URL and try again.',
    );
    router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)]);
    throw new Error('Token is invalid or missing');
  }
  return token;
};
