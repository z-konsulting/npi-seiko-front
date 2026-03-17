import { HttpInterceptorFn } from "@angular/common/http";
import { catchError, from, switchMap, throwError } from "rxjs";
import { inject } from "@angular/core";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { Router } from "@angular/router";
import { AuthenticationService } from "../../security/authentication.service";
import { CustomErrorCode } from "../../../client/npiSeiko";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { StateParamKey } from "../../models/enums/stateParamKey";
import { DialogService } from "primeng/dynamicdialog";
import { LoaderService } from "../../services/components/loader.service";
import { SKIP_ERROR_TOAST } from "./http-context-tokens";

interface ErrorResponse {
  code: string;
  message: string;
}

export const handleErrorRequestInterceptorFn: HttpInterceptorFn = (
  req,
  next,
) => {
  const toast = inject(HandleToastMessageService);
  const router = inject(Router);
  const auth = inject(AuthenticationService);
  const dialog = inject(DialogService);
  const loader = inject(LoaderService);
  const skipToastContextToken = req.context.get(SKIP_ERROR_TOAST);

  /** ------------------------------------------------------------------
   *  Method 1 : Logout + toast + redirect (MUST_BE_DISCONNECTED)
   * ------------------------------------------------------------------*/
  function handleMustBeDisconnected(errorResponse: ErrorResponse) {
    loader.hideLoader();

    if (dialog.dialogComponentRefMap) {
      dialog.dialogComponentRefMap.forEach((dialog) => {
        dialog.destroy();
      });
      dialog.dialogComponentRefMap.clear();
    }
    toast.errorMessage(
      errorResponse?.message ??
        "You do not have the necessary authorizations to access this resource.",
    );

    auth.storeUserLogged("false");

    router.navigate([RoutingService.fullPathRoute(RouteId.LOGIN)], {
      state: {
        [StateParamKey.DISCONNECTED]: true,
        [StateParamKey.REASON]: "session expired",
      },
    });

    return throwError(() => errorResponse);
  }

  /** --------------------------------------
   *  Method 2 : Managing normal errors
   * --------------------------------------*/
  function handleAllError(errorResponse: ErrorResponse) {
    if (errorResponse?.code === CustomErrorCode.MUST_BE_DISCONNECTED) {
      return handleMustBeDisconnected(errorResponse);
    }

    toast.handleErrorWithCodeV2(errorResponse);
    return throwError(() => errorResponse);
  }

  /** ----------------------------------------------------------
   *  Method 3 : Converting a JSON Blob into a JSON Error
   * ----------------------------------------------------------*/
  function transformBlobError(error: any) {
    const blob: Blob = error?.error;

    return from(blob.text()).pipe(
      switchMap((text) => {
        let json: any;

        try {
          json = JSON.parse(text);
        } catch {
          // Unreadable blob → fallback to a normal error
          return handleAllError(error);
        }

        // We recreate the error with a real JSON body
        const transformedError: ErrorResponse = json;
        return handleAllError(transformedError);
      }),
    );
  }

  /** -----------------------------------------------------------------
   *  Main chain of the interceptor
   * ------------------------------------------------------------------*/
  return next(req).pipe(
    catchError((error: any) => {
      if (skipToastContextToken) {
        return throwError(() => error);
      }
      const errorBody = error?.error;
      if (
        errorBody instanceof Blob &&
        errorBody.type?.includes("application/json")
      ) {
        return transformBlobError(error);
      }
      const errorResponse: ErrorResponse = {
        code: errorBody?.code ?? error?.code ?? "",
        message: errorBody?.message ?? error?.message ?? "",
      };
      return handleAllError(errorResponse);
    }),
  );
};
