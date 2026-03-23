import { ChangeDetectionStrategy, Component, inject, OnInit } from "@angular/core";
import { CardModule } from "primeng/card";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { Button } from "primeng/button";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CalendarItem, DayType } from "../../../../client/npiSeiko";
import {
  CalendarCustomService,
  DayTypeOptions,
} from "../../../services/calendar-custom.service";
import { CalendarEventFormField } from "../../../models/enums/calendar-event-form-field";
import { CalendarRepo } from "../../../repositories/calendar-repo";
import { BaseModal } from "../../../models/classes/base-modal";
import { InputContainerComponent } from "../../../components/input-container/input-container.component";
import { Icons } from "../../../models/enums/icons";
import { CalendarEventColor } from "../../../models/enums/calendar-event-color";

@Component({
  selector: "app-calendar-create-edit-dialog",
  imports: [
    CardModule,
    FormsModule,
    ReactiveFormsModule,
    Button,
    InputContainerComponent,
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
  displayDate: string = "";

  calendarEventForm: FormGroup = this.fb.group({
    [CalendarEventFormField.TITLE]: new FormControl<DayType>(DayType.WORKING),
    [CalendarEventFormField.REMARK]: new FormControl<string | null>(null),
  });

  protected readonly CalendarEventFormFieldName = CalendarEventFormField;
  protected readonly DayType = DayType;
  protected readonly Icons = Icons;
  protected readonly CalendarEventColor = CalendarEventColor;

  protected readonly dayTypeConfig: {
    type: DayType;
    label: string;
    icon: string;
    color: string;
    cssKey: string;
  }[] = [
    {
      type: DayType.WORKING,
      label: "Working Day",
      icon: Icons.BRIEFCASE,
      color: CalendarEventColor.WORKING_COLOR,
      cssKey: "working",
    },
    {
      type: DayType.WORKING_HALF_DAY,
      label: "Half Day",
      icon: Icons.CLOCK,
      color: CalendarEventColor.WORKING_HALF_DAY,
      cssKey: "working-half-day",
    },
    {
      type: DayType.NOT_WORKING,
      label: "Non-Working",
      icon: Icons.BAN,
      color: CalendarEventColor.NOT_WORKING_COLOR,
      cssKey: "not-working",
    },
    {
      type: DayType.PUBLIC_HOLIDAY,
      label: "Public Holiday",
      icon: Icons.STAR,
      color: CalendarEventColor.PUBLIC_HOLIDAY_COLOR,
      cssKey: "public-holiday",
    },
  ];

  ngOnInit(): void {
    if (this.config.data) {
      this.calendarEvent = this.config.data.calendarItem;
      this.dayTypeSelected = this.calendarEvent.value;
      this.displayDate = new Date(this.calendarEvent.date).toLocaleDateString(
        "en-US",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" },
      );
      this.calendarEventForm.patchValue({
        [CalendarEventFormField.TITLE]: this.calendarEvent.value,
        [CalendarEventFormField.REMARK]: this.calendarEvent.remark ?? "",
      });
    }
    this.daysType = this.calendarCustomService.initDaysTypeOption();
  }

  selectDayType(type: DayType): void {
    this.dayTypeSelected = type;
    this.calendarEventForm.patchValue({
      [CalendarEventFormField.TITLE]: type,
    });
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
