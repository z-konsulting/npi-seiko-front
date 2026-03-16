import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  Unit,
  Unit2 as UnitSDK,
  UnitCreate,
  UnitsPaginated,
  UnitUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class UnitRepo {
  constructor(private unitService: UnitSDK) {}

  listAllUnits(): Observable<Unit[]> {
    return fromRequest(this.unitService.listAllUnits()) as Observable<Unit[]>;
  }

  searchUnits(
    offset?: number,
    limit?: number | null,
    search?: string,
  ): Observable<UnitsPaginated> {
    return fromRequest(
      this.unitService.searchUnits({
        body: { searchText: search ?? "" },
        query: { offset: offset ?? 0, limit: limit ?? 10 },
      }),
    );
  }

  retrieveUnit(uid: string): Observable<Unit> {
    return fromRequest(this.unitService.retrieveUnit({ path: { uid } }));
  }

  createUnit(name: string): Observable<unknown> {
    const body: UnitCreate = { name };
    return fromRequest(this.unitService.createUnit({ body }));
  }

  updateUnit(uid: string, name: string): Observable<Unit> {
    const body: UnitUpdate = { name };
    return fromRequest(this.unitService.updateUnit({ body, path: { uid } }));
  }

  archiveUnit(uid: string): Observable<unknown> {
    return fromRequest(this.unitService.archiveUnit({ path: { uid } }));
  }

  existUnitByName(name: string): Observable<string | null> {
    return fromRequest(
      this.unitService.existUnitByName({
        body: { value: name },
      }),
    ) as Observable<string | null>;
  }
}
