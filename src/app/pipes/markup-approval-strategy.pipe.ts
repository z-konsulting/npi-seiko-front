import { Pipe, PipeTransform } from "@angular/core";
import { MarkupApprovalStrategy } from "../../client/costSeiko";

@Pipe({
  name: "markupApprovalStrategy",
  standalone: true,
})
export class MarkupApprovalStrategyPipe implements PipeTransform {
  transform(value: MarkupApprovalStrategy): string {
    switch (value) {
      case MarkupApprovalStrategy.FOR_ALL_QUOTATIONS:
        return "For All Quotations";
      case MarkupApprovalStrategy.BASED_ON_CUSTOM_RULES:
        return "Based on Custom Rules";
      default:
        return "";
    }
  }
}
