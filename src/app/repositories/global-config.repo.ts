import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  Currency,
  GlobalConfig as GlobalConfigType,
  GlobalConfig2 as GlobalConfigSDK,
  GlobalConfigPatch,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class GlobalConfigRepo {
  constructor(private globalConfigService: GlobalConfigSDK) {}

  getGlobalConfig(): Observable<GlobalConfigType> {
    return fromRequest(this.globalConfigService.getGlobalConfig());
  }

  patchGlobalConfig(patch: GlobalConfigPatch): Observable<GlobalConfigType> {
    return fromRequest(
      this.globalConfigService.patchGlobalConfig({
        body: patch,
      }),
    );
  }

  getSystemTargetCurrency(): Observable<Currency> {
    return fromRequest(this.globalConfigService.getSystemTargetCurrency());
  }
}
