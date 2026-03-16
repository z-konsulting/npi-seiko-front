import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { CustomerRepo } from "../repositories/customer.repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Customer } from "../../client/costSeiko";

@Injectable({
  providedIn: "root",
})
export class IndicatorService {
  readonly customers = signal<Customer[]>([]);
  private destroyRef = inject(DestroyRef);
  private customerRepo = inject(CustomerRepo);

  getAllCustomer() {
    this.customerRepo
      .listAllCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            this.customers.set(response);
          } else {
            this.customers.set([]);
          }
        },
      });
  }

  reinitCustomer() {
    this.customers.set([]);
  }
}
