import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  BomConfig,
  BomConfiguration,
  BomConfigurationCreate,
  BomConfigurationsPaginated,
  BomConfigurationUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({ providedIn: "root" })
export class BomConfigurationRepo {
  private readonly bomConfigService = inject(BomConfig);

  search(
    offset?: number,
    limit?: number,
    search?: string,
  ): Observable<BomConfigurationsPaginated> {
    return fromRequest(
      this.bomConfigService.searchBomConfigurations({
        body: { searchText: search ?? "" },
        query: { offset: offset ?? 0, limit: limit ?? 10 },
      }),
    );
  }

  retrieve(uid: string): Observable<BomConfiguration> {
    return fromRequest(
      this.bomConfigService.retrieveBomConfiguration({ path: { uid } }),
    );
  }

  create(body: BomConfigurationCreate): Observable<unknown> {
    return fromRequest(this.bomConfigService.createBomConfiguration({ body }));
  }

  update(
    uid: string,
    body: BomConfigurationUpdate,
  ): Observable<BomConfiguration> {
    return fromRequest(
      this.bomConfigService.updateBomConfiguration({ body, path: { uid } }),
    );
  }

  archive(uid: string): Observable<unknown> {
    return fromRequest(
      this.bomConfigService.archiveBomConfiguration({ path: { uid } }),
    );
  }

  listAllBomConfigurations() {
    return fromRequest(
      this.bomConfigService.listAllBomConfigurations(),
    ) as Observable<BomConfiguration[]>;
  }
}
