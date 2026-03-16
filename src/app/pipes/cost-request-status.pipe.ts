import { Pipe, PipeTransform } from "@angular/core";
import { CostRequestStatus } from "../../client/costSeiko";

@Pipe({
  name: "costRequestStatus",
  standalone: true,
})
export class CostRequestStatusPipe implements PipeTransform {
  transform(
    value: CostRequestStatus,
    returnType: "label" | "severity" | "class" = "label",
  ): any {
    if (returnType === "severity") {
      return this.getSeverity(value);
    }
    if (returnType === "class") {
      return this.getClass(value);
    }
    return this.getLabel(value);
  }

  private getClass(value: CostRequestStatus): string {
    switch (value) {
      case CostRequestStatus.READY_TO_ESTIMATE:
        return "p-tag-status-ready-estimate";
      case CostRequestStatus.PENDING_REESTIMATION:
        return "p-tag-status-pending-reestimation";
      case CostRequestStatus.PENDING_APPROVAL:
        return "p-tag-status-pending-approval";
      case CostRequestStatus.ABORTED:
        return "p-tag-status-aborted";
      case CostRequestStatus.NEW_REVISION_CREATED:
        return "p-tag-status-new-revision-created";
      case CostRequestStatus.READY_TO_VALIDATE:
        return "p-tag-status-ready-to-validate";
      case CostRequestStatus.READY_TO_QUOTE:
        return "p-tag-status-quoted";
      case CostRequestStatus.ACTIVE:
        return "p-tag-status-active";
      case CostRequestStatus.WON:
        return "p-tag-status-won";
      case CostRequestStatus.LOST:
        return "p-tag-status-lost";
      default:
        return "";
    }
  }

  private getLabel(value: CostRequestStatus): string {
    switch (value) {
      case CostRequestStatus.PENDING_INFORMATION:
        return "PENDING INFORMATION";
      case CostRequestStatus.READY_FOR_REVIEW:
        return "READY FOR REVIEW";
      case CostRequestStatus.READY_TO_ESTIMATE:
        return "READY TO ESTIMATE";
      case CostRequestStatus.READY_TO_VALIDATE:
        return "READY TO VALIDATE";
      case CostRequestStatus.READY_FOR_MARKUP:
        return "READY FOR MARKUP";
      case CostRequestStatus.PENDING_APPROVAL:
        return "PENDING APPROVAL";
      case CostRequestStatus.PRICE_APPROVED:
        return "PRICE APPROVED";
      case CostRequestStatus.PRICE_REJECTED:
        return "PRICE REJECTED";
      case CostRequestStatus.READY_TO_QUOTE:
        return "READY TO QUOTE";
      case CostRequestStatus.ABORTED:
        return "ABORTED";
      case CostRequestStatus.NEW_REVISION_CREATED:
        return "NEW REVISION";
      case CostRequestStatus.PENDING_REESTIMATION:
        return "PENDING REESTIMATION";
      case CostRequestStatus.ACTIVE:
        return "ACTIVE";
      case CostRequestStatus.WON:
        return "WON";
      case CostRequestStatus.LOST:
        return "LOST";
      default:
        return "";
    }
  }

  private getSeverity(
    value: CostRequestStatus,
  ): "success" | "warn" | "danger" | "secondary" | "info" | "contrast" {
    switch (value) {
      case CostRequestStatus.PRICE_APPROVED:
        return "success";
      case CostRequestStatus.PENDING_INFORMATION:
        return "warn";
      case CostRequestStatus.READY_FOR_REVIEW:
        return "contrast";
      case CostRequestStatus.READY_FOR_MARKUP:
        return "info";
      case CostRequestStatus.PRICE_REJECTED:
        return "danger";
      default:
        return "info";
    }
  }
}
