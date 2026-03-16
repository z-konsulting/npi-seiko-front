import { HttpHeaders, HttpParams } from '@angular/common/http';

export class HttpOptions {
  static buildHttpOptions(
    paramsData?: { [param: string]: string | number },
    additionalHeaders?: { [header: string]: string },
  ): {
    headers: HttpHeaders;
    params: HttpParams;
  } {
    // Add request params if provided
    let params = new HttpParams();
    if (paramsData) {
      Object.keys(paramsData).forEach((key) => {
        params = params.set(key, paramsData[key].toString());
      });
    }

    // Add additional headers if provided
    let headers = new HttpHeaders();
    if (additionalHeaders) {
      Object.keys(additionalHeaders).forEach((key) => {
        headers = headers.set(key, additionalHeaders[key]);
      });
    }

    return { headers, params };
  }
}
