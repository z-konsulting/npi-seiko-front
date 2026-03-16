import { Pipe, PipeTransform } from "@angular/core";
import { OutsourcingStatus } from "../../client/costSeiko";

@Pipe({
  name: "outsourcingStatus",
  standalone: true,
})
export class OutsourcingStatusPipe implements PipeTransform {
  static getSeverity(
    value: OutsourcingStatus | undefined | null,
  ): "warn" | "success" | "danger" | "secondary" {
    switch (value) {
      case OutsourcingStatus.TO_BE_ESTIMATED:
        return "warn";
      case OutsourcingStatus.ESTIMATED:
        return "success";
      case OutsourcingStatus.REJECTED:
        return "danger";
      default:
        return "secondary";
    }
  }

  transform(
    value: OutsourcingStatus | undefined | null,
    returnType: "label" | "severity" = "label",
  ): any {
    if (returnType === "severity") {
      return OutsourcingStatusPipe.getSeverity(value);
    }
    switch (value) {
      case OutsourcingStatus.TO_BE_ESTIMATED:
        return "TO BE ESTIMATED";
      case OutsourcingStatus.ESTIMATED:
        return "ESTIMATED";
      case OutsourcingStatus.REJECTED:
        return "REJECTED";
      default:
        return "—";
    }
  }
}
