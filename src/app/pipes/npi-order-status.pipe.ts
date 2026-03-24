import { Pipe, PipeTransform } from "@angular/core";
import { NpiOrderStatus } from "../../client/npiSeiko";

@Pipe({
  name: "npiOrderStatus",
  standalone: true,
})
export class NpiOrderStatusPipe implements PipeTransform {
  transform(
    value: NpiOrderStatus,
    returnType: "label" | "severity" = "label",
  ): any {
    if (returnType === "severity") {
      return this.getSeverity(value);
    }
    return this.getLabel(value);
  }

  private getLabel(value: NpiOrderStatus): string {
    switch (value) {
      case NpiOrderStatus.PENDING_PRODUCTION_DATES:
        return "PENDING PROD. DATES";
      case NpiOrderStatus.READY_TO_START:
        return "READY TO START";
      case NpiOrderStatus.STARTED:
        return "STARTED";
      case NpiOrderStatus.COMPLETED:
        return "COMPLETED";
      case NpiOrderStatus.ABORTED:
        return "ABORTED";
      case NpiOrderStatus.FAILED:
        return "FAILED";
      default:
        return "";
    }
  }

  private getSeverity(
    value: NpiOrderStatus,
  ): "success" | "warn" | "danger" | "secondary" | "info" | "contrast" {
    switch (value) {
      case NpiOrderStatus.PENDING_PRODUCTION_DATES:
        return "warn";
      case NpiOrderStatus.READY_TO_START:
        return "info";
      case NpiOrderStatus.STARTED:
        return "contrast";
      case NpiOrderStatus.COMPLETED:
        return "success";
      case NpiOrderStatus.ABORTED:
        return "secondary";
      case NpiOrderStatus.FAILED:
        return "danger";
      default:
        return "secondary";
    }
  }
}
