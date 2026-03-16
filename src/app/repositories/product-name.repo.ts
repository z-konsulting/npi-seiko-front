import { Injectable } from "@angular/core";
import {
  ProductName,
  ProductName2 as ProductNameSdk,
  ProductNameCreate,
  ProductNamesPaginated,
  ProductNameUpdate,
} from "../../client/costSeiko";
import { Observable } from "rxjs";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class ProductNameRepo {
  constructor(private productNameService: ProductNameSdk) {}

  listAllProductNames(): Observable<ProductName[]> {
    return fromRequest(
      this.productNameService.listAllProductNames(),
    ) as Observable<ProductName[]>;
  }

  searchProductNames(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<ProductNamesPaginated> {
    return fromRequest(
      this.productNameService.searchProductNames({
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

  getProductName(productNameUid: string): Observable<ProductName> {
    return fromRequest(
      this.productNameService.retrieveProductName({
        path: {
          uid: productNameUid,
        },
      }),
    );
  }

  createProductName(name: string, code: string) {
    const body: ProductNameCreate = {
      name,
      code,
    };
    return fromRequest(
      this.productNameService.createProductName({
        body,
      }),
    );
  }

  updateProductName(
    productNameUid: string,
    name: string,
    code: string,
  ): Observable<ProductName> {
    const body: ProductNameUpdate = {
      name,
      code,
    };
    return fromRequest(
      this.productNameService.updateProductName({
        body,
        path: {
          uid: productNameUid,
        },
      }),
    );
  }

  archiveProductName(productNameUid: string) {
    return fromRequest(
      this.productNameService.archiveProductName({
        path: {
          uid: productNameUid,
        },
      }),
    );
  }
}
