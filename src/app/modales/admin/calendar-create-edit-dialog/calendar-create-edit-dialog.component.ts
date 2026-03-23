import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { CardModule } from "primeng/card";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { SelectButtonModule } from "primeng/selectbutton";
import { Button } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SelectButtonChangeEvent } from "primeng/selectbutton";
import { CalendarItem, DayType } from "../../../../client/npiSeiko";
import {
  CalendarCustomService,
  DayTypeOptions,
} from "../../../services/calendar-custom.service";
import { CalendarEventFormField } from "../../../models/enums/calendar-event-form-field";
import { CalendarRepo } from "../../../repositories/calendar-repo";
import { BaseModal } from "../../../models/classes/base-modal";
import { Textarea } from "primeng/textarea";

@Component({
  selector: "app-calendar-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectButtonModule,
    Button,
    Textarea,
  ],
  templateUrl: "./calendar-create-edit-dialog.component.html",
  styleUrl: "./calendar-create-edit-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCreateEditDialogComponent
  extends BaseModal
  implements OnInit
{
  private readonly calendarCustomService = inject(CalendarCustomService);
  private readonly calendarRepo = inject(CalendarRepo);
  private readonly fb = inject(FormBuilder);

  calendarEvent!: CalendarItem;
  daysType: DayTypeOptions[] = [];
  dayTypeSelected!: DayType;

  calendarEventForm: FormGroup = this.fb.group({
    [CalendarEventFormField.TITLE]: new FormControl<DayType>(DayType.WORKING),
    [CalendarEventFormField.REMARK]: new FormControl<string | null>(null),
  });

  protected readonly CalendarEventFormFieldName = CalendarEventFormField;

  ngOnInit(): void {
    if (this.config.data) {
      this.calendarEvent = this.config.data.calendarItem;
      this.dayTypeSelected = this.calendarEvent.value;
      this.calendarEventForm.patchValue({
        [CalendarEventFormField.TITLE]: this.calendarEvent.value,
        [CalendarEventFormField.REMARK]: this.calendarEvent.remark ?? "",
      });
    }
    this.daysType = this.calendarCustomService.initDaysTypeOption();
  }

  change($event: SelectButtonChangeEvent): void {
    this.dayTypeSelected = $event.value as DayType;
  }

  sendCalendarEvent(): void {
    const calendarItem: CalendarItem = {
      date: this.calendarEvent.date,
      remark:
        this.calendarEventForm.get(CalendarEventFormField.REMARK)?.value ?? "",
      value: this.calendarEventForm.get(CalendarEventFormField.TITLE)!.value,
    };
    this.calendarRepo
      .updateCalendarEvent(calendarItem)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDialog(true);
        },
      });
  }
}
