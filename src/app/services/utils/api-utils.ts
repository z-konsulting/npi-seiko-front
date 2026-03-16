import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type MinimalRequestResult<TData = unknown, TError = unknown> = {
  data?: TData;
  error?: TError | null;
  status?: number;
};

export function fromRequest<TData, TError = unknown>(
  promise: Promise<MinimalRequestResult<TData, TError>>,
): Observable<TData> {
  return from(promise).pipe(
    map((result) => {
      if (result.error) {
        throw result.error;
      }

      if (result.data === undefined) {
        throw new Error('API result.data is undefined');
      }

      return result.data;
    }),
    catchError((err) => {
      return throwError(() => err);
    }),
  );
}
