import { Pipe, PipeTransform } from "@angular/core";
import { AutomaticExchangeRateFrequency } from "../../client/costSeiko";

@Pipe({
  name: "automaticExchangeRateFrequency",
  standalone: true,
})
export class AutomaticExchangeRateFrequencyPipe implements PipeTransform {
  transform(value: AutomaticExchangeRateFrequency): string {
    switch (value) {
      case AutomaticExchangeRateFrequency.EVERY_HOUR:
        return "Every Hour";
      case AutomaticExchangeRateFrequency.EVERY_DAY:
        return "Every Day";
      case AutomaticExchangeRateFrequency.EVERY_WEEK:
        return "Every Week";
      default:
        return "";
    }
  }
}
