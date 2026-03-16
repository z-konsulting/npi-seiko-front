import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { Select } from "primeng/select";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Icons } from "../../models/enums/icons";
import { MultiSelect } from "primeng/multiselect";
import { Popover } from "primeng/popover";
import { Tooltip } from "primeng/tooltip";
import {
  ChartPeriodType,
  Customer,
  IndicatorsBody,
} from "../../../client/costSeiko";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CustomerRepo } from "../../repositories/customer.repo";
import { EnumTransformerService } from "../../services/components/enum-transformer.service";

@Component({
  selector: "app-indicator-filter",
  imports: [Select, FormsModule, Button, MultiSelect, Popover, Tooltip],
  templateUrl: "./indicator-filter.component.html",
  styleUrl: "./indicator-filter.component.scss",
  providers: [],
})
export class IndicatorFilterComponent implements OnInit {
  indicatorBodyEmitter = output<IndicatorsBody>();
  showPeriod = input(false);
  showCustomer = input(false);
  selectedPeriodTypeValue: ChartPeriodType = ChartPeriodType.WEEKLY;
  selectedCustomers: Customer[] = [];
  readonly customers = signal<Customer[]>([]);
  protected readonly Icons = Icons;
  private destroyRef = inject(DestroyRef);
  private customerRepo = inject(CustomerRepo);
  private enumTransformerService = inject(EnumTransformerService);
  chartPeriodTypeOptions = this.enumTransformerService.enumToLabelValue(
    ChartPeriodType,
    (value) => value,
  );

  constructor() {}

  ngOnInit() {
    this.customerRepo
      .listAllCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            this.customers.set(response);
          } else {
            this.customers.set([]);
          }
          this.onValidateFiler();
        },
      });
  }

  onValidateFiler() {
    this.indicatorBodyEmitter.emit(this.createBody());
  }

  private createBody() {
    let body: IndicatorsBody = {
      chartPeriodType: this.selectedPeriodTypeValue,
      customerIds: (this.selectedCustomers ?? []).map(
        (customer) => customer.uid,
      ),
    };
    return body;
  }
}
