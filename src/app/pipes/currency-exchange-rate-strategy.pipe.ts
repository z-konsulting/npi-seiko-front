import { Pipe, PipeTransform } from "@angular/core";
import { CurrencyExchangeRateStrategy } from "../../client/costSeiko";

@Pipe({
  name: "currencyExchangeRateStrategy",
  standalone: true,
})
export class CurrencyExchangeRateStrategyPipe implements PipeTransform {
  transform(value: CurrencyExchangeRateStrategy): string {
    switch (value) {
      case CurrencyExchangeRateStrategy.AUTOMATICALLY_UPDATED:
        return "Automatically Updated";
      case CurrencyExchangeRateStrategy.MANUALLY_UPDATED:
        return "Manually Updated";
      default:
        return "";
    }
  }
}
