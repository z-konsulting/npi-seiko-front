import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  ShipmentLocation,
  ShipmentLocation2 as ShipmentLocationSDK,
  ShipmentLocationCreate,
  ShipmentLocationsPaginated,
  ShipmentLocationUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class ShipmentLocationRepo {
  constructor(private shipmentLocationService: ShipmentLocationSDK) {}

  searchShipmentLocations(
    offset?: number,
    limit?: number | null,
    search?: string,
  ): Observable<ShipmentLocationsPaginated> {
    return fromRequest(
      this.shipmentLocationService.searchShipmentLocations({
        body: { searchText: search ?? "" },
        query: { offset: offset ?? 0, limit: limit ?? 10 },
      }),
    );
  }

  listAllShipmentLocations(): Observable<ShipmentLocation[]> {
    return fromRequest(
      this.shipmentLocationService.listAllShipmentLocations(),
    ) as Observable<ShipmentLocation[]>;
  }

  retrieveShipmentLocation(uid: string): Observable<ShipmentLocation> {
    return fromRequest(
      this.shipmentLocationService.retrieveShipmentLocation({
        path: { uid },
      }),
    );
  }

  createShipmentLocation(body: ShipmentLocationCreate): Observable<unknown> {
    return fromRequest(
      this.shipmentLocationService.createShipmentLocation({ body }),
    );
  }

  updateShipmentLocation(
    uid: string,
    body: ShipmentLocationUpdate,
  ): Observable<ShipmentLocation> {
    return fromRequest(
      this.shipmentLocationService.updateShipmentLocation({
        body,
        path: { uid },
      }),
    );
  }

  archiveShipmentLocation(uid: string): Observable<unknown> {
    return fromRequest(
      this.shipmentLocationService.archiveShipmentLocation({
        path: { uid },
      }),
    );
  }
}
