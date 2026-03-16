import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { DatePicker } from "primeng/datepicker";
import { Button } from "primeng/button";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { addMonths, isAfter, isBefore } from "date-fns";
import { BaseModal } from "../../models/classes/base-modal";
import { LoaderService } from "../../services/components/loader.service";
import { Ripple } from "primeng/ripple";
import { Icons } from "../../models/enums/icons";
import { NoDoubleClickDirective } from "../../directives/no-double-click.directive";
import { DateFormField } from "../../models/enums/date-form-field";

export interface DatePickerStartEnd {
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: "app-export-month-filter",
  imports: [
    DatePicker,
    Button,
    ReactiveFormsModule,
    Ripple,
    NoDoubleClickDirective,
  ],
  templateUrl: "./export-month-filter.component.html",
  styleUrl: "./export-month-filter.component.scss",
})
export class ExportMonthFilterComponent extends BaseModal implements OnInit {
  @Output() dateSelectedEmitter: EventEmitter<DatePickerStartEnd> =
    new EventEmitter();
  formGroup!: FormGroup;
  maxEndDate: Date | null = null;

  protected readonly DateFormField = DateFormField;
  protected readonly Icons = Icons;

  constructor(private readonly customLoader: LoaderService) {
    super();
    this.formGroup = this.formService.buildDateForm();
  }

  ngOnInit() {}

  onStartDateSelected() {
    this.formGroup.get(DateFormField.END_DATE)?.enable();
    const endDate = this.formGroup.get(DateFormField.END_DATE)?.value;
    const startDate = this.formGroup.get(DateFormField.START_DATE)?.value;
    if (startDate) {
      this.maxEndDate = addMonths(new Date(startDate), 3);
      if (
        endDate &&
        (isBefore(endDate, startDate) || isAfter(endDate, this.maxEndDate))
      ) {
        this.formGroup.get(DateFormField.END_DATE)?.reset();
      }
    } else {
      this.maxEndDate = null; // Réinitialiser la limite si START_DATE est absent
    }
  }

  onSubmit() {
    this.customLoader.showLoader("Export in progress...");
    this.dateSelectedEmitter.emit({
      startDate: this.formGroup.get(DateFormField.START_DATE)?.value,
      endDate: this.formGroup.get(DateFormField.END_DATE)?.value,
    });
  }
}
