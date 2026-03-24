import { Injectable } from "@angular/core";
import { NpiOrder, NpiOrderStatus } from "../../client/npiSeiko";

@Injectable({
  providedIn: "root",
})
export class NpiService {
  canAbort(status: NpiOrderStatus): boolean {
    return (
      status === NpiOrderStatus.PENDING_PRODUCTION_DATES ||
      status === NpiOrderStatus.READY_TO_START ||
      status === NpiOrderStatus.STARTED
    );
  }

  isFinalOrder(status: NpiOrderStatus): boolean {
    return (
      status === NpiOrderStatus.COMPLETED ||
      status === NpiOrderStatus.ABORTED ||
      status === NpiOrderStatus.FAILED
    );
  }

  isUpdatable(status: NpiOrderStatus): boolean {
    return status !== NpiOrderStatus.STARTED && !this.isFinalOrder(status);
  }

  isArchived(npiOrder: NpiOrder) {
    return npiOrder.archived ?? false;
  }
}
