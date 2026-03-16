import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  ShipmentMethod,
  ShipmentMethod2 as ShipmentMethodSDK,
  ShipmentMethodCreate,
  ShipmentMethodsPaginated,
  ShipmentMethodUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class ShipmentMethodRepo {
  constructor(private shipmentMethodService: ShipmentMethodSDK) {}

  listAllShipmentMethods(): Observable<ShipmentMethod[]> {
    return fromRequest(
      this.shipmentMethodService.listAllShipmentMethods(),
    ) as Observable<ShipmentMethod[]>;
  }

  searchShipmentMethods(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<ShipmentMethodsPaginated> {
    return fromRequest(
      this.shipmentMethodService.searchShipmentMethods({
        body: {
          searchText: search ?? "",
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
        },
      }),
    );
  }

  retrieveShipmentMethod(
    shipmentMethodUid: string,
  ): Observable<ShipmentMethod> {
    return fromRequest(
      this.shipmentMethodService.retrieveShipmentMethod({
        path: {
          uid: shipmentMethodUid,
        },
      }),
    );
  }

  createShipmentMethod(name: string, percentage: number) {
    const body: ShipmentMethodCreate = {
      name,
      percentage,
    };
    return fromRequest(
      this.shipmentMethodService.createShipmentMethod({
        body,
      }),
    );
  }

  updateShipmentMethod(
    shipmentMethodUid: string,
    name: string,
    percentage: number,
  ): Observable<ShipmentMethod> {
    const body: ShipmentMethodUpdate = {
      name,
      percentage,
    };
    return fromRequest(
      this.shipmentMethodService.updateShipmentMethod({
        body,
        path: {
          uid: shipmentMethodUid,
        },
      }),
    );
  }

  archiveShipmentMethod(shipmentMethodUid: string) {
    return fromRequest(
      this.shipmentMethodService.archiveShipmentMethod({
        path: {
          uid: shipmentMethodUid,
        },
      }),
    );
  }
}
