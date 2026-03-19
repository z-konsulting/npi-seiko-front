import { Injectable } from "@angular/core";
import {
  Customer,
  Customer2 as CustomerSdk,
  CustomerCreate,
  CustomersPaginated,
  CustomerUpdate,
} from "../../client/npiSeiko";
import { Observable } from "rxjs";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class CustomerRepo {
  constructor(private customerService: CustomerSdk) {}

  addRequestorName(customerUid: string, name: string): Observable<unknown> {
    return fromRequest(
      this.customerService.addRequestorNames({
        path: {
          uid: customerUid,
        },
        body: [name],
      }),
    );
  }

  setRequestorNames(customerUid: string, names: string[]): Observable<unknown> {
    return fromRequest(
      this.customerService.setRequestorNames({
        path: {
          uid: customerUid,
        },
        body: names,
      }),
    );
  }

  getRequestorNames(customerUid: string): Observable<string[]> {
    return fromRequest(
      this.customerService.retrieveRequestorNames({
        path: {
          uid: customerUid,
        },
      }),
    );
  }

  listAllCustomers(): Observable<Customer[]> {
    return fromRequest(this.customerService.listAllCustomers()) as Observable<
      Customer[]
    >;
  }

  searchCustomers(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<CustomersPaginated> {
    return fromRequest(
      this.customerService.searchCustomers({
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

  getCustomer(customerUid: string): Observable<Customer> {
    return fromRequest(
      this.customerService.retrieveCustomer({
        path: {
          uid: customerUid,
        },
      }),
    );
  }

  createCustomer(body: CustomerCreate) {
    return fromRequest(
      this.customerService.createCustomer({
        body,
      }),
    );
  }

  updateCustomer(
    customerUid: string,
    body: CustomerUpdate,
  ): Observable<Customer> {
    return fromRequest(
      this.customerService.updateCustomer({
        body,
        path: {
          uid: customerUid,
        },
      }),
    );
  }

  archiveCustomer(customerUid: string) {
    return fromRequest(
      this.customerService.archiveCustomer({
        path: {
          uid: customerUid,
        },
      }),
    );
  }
}
