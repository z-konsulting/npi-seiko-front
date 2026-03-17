import { Injectable } from "@angular/core";
import { NpiOrder, NpiOrderStatus } from "../../client/npiSeiko";

@Injectable({
  providedIn: "root",
})
export class NpiService {
  canAbort(status: NpiOrderStatus): boolean {
    return (
      status === NpiOrderStatus.READY_TO_PRODUCTION ||
      status === NpiOrderStatus.STARTED
    );
  }

  isFinalOrder(status: NpiOrderStatus): boolean {
    return (
      status === NpiOrderStatus.COMPLETED || status === NpiOrderStatus.ABORTED
    );
  }

  isArchived(npiOrder: NpiOrder) {
    return npiOrder.archived ?? false;
  }
}
