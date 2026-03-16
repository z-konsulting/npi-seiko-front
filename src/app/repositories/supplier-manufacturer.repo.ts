import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  SupplierAndManufacturer,
  SupplierAndManufacturerCreate,
  SupplierAndManufacturerType,
  SupplierAndManufacturerUpdate,
  SupplierManufacturer as SupplierManufacturerSDK,
  SuppliersAndManufacturersPaginated,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class SupplierManufacturerRepo {
  constructor(private supplierManufacturerService: SupplierManufacturerSDK) {}

  listAllSupplierManufacturers(
    type: SupplierAndManufacturerType,
  ): Observable<SupplierAndManufacturer[]> {
    return fromRequest(
      this.supplierManufacturerService.listAllSupplierManufacturers({
        query: { supplierAndManufacturer: type },
      }),
    ) as Observable<SupplierAndManufacturer[]>;
  }

  searchSuppliersManufacturers(
    offset?: number,
    limit?: number | null,
    search?: string,
  ): Observable<SuppliersAndManufacturersPaginated> {
    return fromRequest(
      this.supplierManufacturerService.searchSuppliersManufacturers({
        body: { searchText: search ?? "" },
        query: { offset: offset ?? 0, limit: limit ?? 10 },
      }),
    );
  }

  retrieveSupplierManufacturer(
    uid: string,
  ): Observable<SupplierAndManufacturer> {
    return fromRequest(
      this.supplierManufacturerService.retrieveSupplierManufacturer({
        path: { uid },
      }),
    );
  }

  createSupplierManufacturer(
    body: SupplierAndManufacturerCreate,
  ): Observable<unknown> {
    return fromRequest(
      this.supplierManufacturerService.createSupplierManufacturer({
        body,
        query: { supplierAndManufacturer: body.type },
      }),
    );
  }

  updateSupplierManufacturer(
    uid: string,
    body: SupplierAndManufacturerUpdate,
  ): Observable<SupplierAndManufacturer> {
    return fromRequest(
      this.supplierManufacturerService.updateSupplierManufacturer({
        body,
        path: { uid },
      }),
    );
  }

  archiveSupplierManufacturer(uid: string): Observable<unknown> {
    return fromRequest(
      this.supplierManufacturerService.archiveSupplierManufacturer({
        path: { uid },
      }),
    );
  }

  existSupplierManufacturerByName(name: string): Observable<string | null> {
    return fromRequest(
      this.supplierManufacturerService.existSupplierManufacturerByName({
        body: { value: name },
      }),
    ) as Observable<string | null>;
  }
}
