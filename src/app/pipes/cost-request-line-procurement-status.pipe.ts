import { Pipe, PipeTransform } from "@angular/core";
import { CostRequestLineProcurementStatus } from "../../client/costSeiko";

@Pipe({
  name: "crProcurementStatus",
})
export class CostRequestLineProcurementStatusPipe implements PipeTransform {
  transform(
    value: CostRequestLineProcurementStatus,
    returnType: "label" | "severity" = "label",
  ): any {
    if (returnType === "severity") {
      return this.getSeverity(value);
    }
    return this.getLabel(value);
  }

  private getLabel(value: CostRequestLineProcurementStatus): string {
    switch (value) {
      case CostRequestLineProcurementStatus.OK:
        return "OK";
      case CostRequestLineProcurementStatus.PENDING:
        return "PENDING";
      case CostRequestLineProcurementStatus.MISSING:
        return "MISSING";
      default:
        return "Unknown";
    }
  }

  private getSeverity(
    value: CostRequestLineProcurementStatus,
  ): "success" | "warn" | "danger" | "secondary" | "info" | "contrast" {
    switch (value) {
      case CostRequestLineProcurementStatus.OK:
        return "success";
      case CostRequestLineProcurementStatus.PENDING:
        return "warn";
      case CostRequestLineProcurementStatus.MISSING:
        return "secondary";
      default:
        return "secondary";
    }
  }
}
