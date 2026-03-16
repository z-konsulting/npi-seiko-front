import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { Currency } from "../../../client/costSeiko";
import { CardModule } from "primeng/card";
import { Tag } from "primeng/tag";
import { DecimalPipe } from "@angular/common";

@Component({
  selector: "app-currency-conversion-display",
  imports: [CardModule, Tag, DecimalPipe],
  templateUrl: "./currency-conversion-display.component.html",
  styleUrl: "./currency-conversion-display.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyConversionDisplayComponent {
  // Required inputs
  currency = input.required<Currency | null>();
  amount = input.required<number>();

  // Optional inputs with defaults
  label = input<string>("Cost");
  targetCurrencyCode = input<string>("MYR");
  showHeader = input<boolean>(true);
  headerTitle = input<string>("Cost Conversion");
  headerIcon = input<string>("pi pi-calculator");

  // Computed signal for exchange rate to target currency
  exchangeRate = computed(() => {
    const curr = this.currency();
    const target = this.targetCurrencyCode();

    if (!curr || !curr.exchangeRates) {
      return 0;
    }
    if (curr.code === this.targetCurrencyCode()) {
      return 1;
    }
    // Find the exchange rate for the target currency
    const rate = curr.exchangeRates.find((er) => er.toCurrencyCode === target);

    return rate ? parseFloat(rate.rate as any) : 0;
  });

  // Computed signal for cost in target currency
  convertedAmount = computed(() => {
    const amt = this.amount();
    const rate = this.exchangeRate();

    if (rate > 0 && amt > 0) {
      return amt * rate;
    }
    return 0;
  });

  // Check if we should display the component
  shouldDisplay = computed(() => {
    return this.currency() !== null;
  });
}
