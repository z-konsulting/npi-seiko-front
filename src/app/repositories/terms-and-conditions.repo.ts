import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  TermsAndConditions as TermsAndConditionsSDK,
  TermsAndConditionsDyson,
  TermsAndConditionsDysonPatch,
  TermsAndConditionsNonDyson,
  TermsAndConditionsNonDysonPatch,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class TermsAndConditionsRepo {
  constructor(private termsService: TermsAndConditionsSDK) {}

  getTermsNonDyson(
    customerUid: string,
  ): Observable<TermsAndConditionsNonDyson> {
    return fromRequest(
      this.termsService.getTermsAndConditionsNonDyson({
        path: { uid: customerUid },
      }),
    );
  }

  patchTermsNonDyson(
    customerUid: string,
    patch: TermsAndConditionsNonDysonPatch,
  ): Observable<TermsAndConditionsNonDyson> {
    return fromRequest(
      this.termsService.patchTermsAndConditionsNonDyson({
        path: { uid: customerUid },
        body: patch,
      }),
    );
  }

  getTermsDyson(
    customerUid: string,
  ): Observable<TermsAndConditionsDyson> {
    return fromRequest(
      this.termsService.getTermsAndConditionsDyson({
        path: { uid: customerUid },
      }),
    );
  }

  patchTermsDyson(
    customerUid: string,
    patch: TermsAndConditionsDysonPatch,
  ): Observable<TermsAndConditionsDyson> {
    return fromRequest(
      this.termsService.patchTermsAndConditionsDyson({
        path: { uid: customerUid },
        body: patch,
      }),
    );
  }
}
