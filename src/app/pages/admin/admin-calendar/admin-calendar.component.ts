import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  CalendarDatePipe,
  CalendarEvent,
  CalendarMonthViewComponent,
  CalendarMonthViewDay,
  CalendarNextViewDirective,
  CalendarPreviousViewDirective,
  CalendarTodayDirective,
  CalendarView,
} from "angular-calendar";
import { Icons } from "../../../models/enums/icons";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { TooltipModule } from "primeng/tooltip";
import {
  endOfMonth,
  format,
  Interval,
  isWithinInterval,
  startOfMonth,
} from "date-fns";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ModalService } from "../../../services/components/modal.service";
import { map } from "rxjs";
import { CalendarRepo } from "../../../repositories/calendar-repo";
import { HandleToastMessageService } from "../../../services/handle-toast-message.service";
import { RoutingService } from "../../../services/Routing.service";
import { RouteId } from "../../../models/enums/routes-id";
import { CustomTitleComponent } from "../../../components/custom-title/custom-title.component";
import { CalendarDayTypePipe } from "../../../pipes/calendar-day-type.pipe";
import { CalendarCustomService } from "../../../services/calendar-custom.service";
import { CalendarEventColor } from "../../../models/enums/calendar-event-color";
import { CalendarItem, DayType } from "../../../../client/npiSeiko";

interface MonthViewBeforeRenderEvent {
  header: unknown[];
  body: CalendarMonthViewDay[];
}

@Component({
  selector: "app-admin-calendar",
  imports: [
    CalendarMonthViewComponent,
    CalendarPreviousViewDirective,
    CalendarNextViewDirective,
    CalendarTodayDirective,
    CalendarDatePipe,
    CardModule,
    Button,
    TooltipModule,
    ConfirmDialogModule,
    CalendarDayTypePipe,
    CustomTitleComponent,
  ],
  templateUrl: "./admin-calendar.component.html",
  styleUrl: "./admin-calendar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminCalendarComponent implements OnInit {
  viewDate: Date = new Date();
  startDate!: string;
  endDate!: string;
  view: CalendarView = CalendarView.Month;
  events = signal<CalendarEvent[]>([]);

  protected readonly Icons = Icons;
  protected readonly DayType = DayType;
  protected readonly CalendarEventColor = CalendarEventColor;
  protected readonly title: string = RoutingService.getRouteTitle(
    RouteId.ADMIN_CALENDAR,
  );

  protected readonly legendItems: {
    type: DayType;
    label: string;
    cssKey: string;
    color: string;
  }[] = [
    {
      type: DayType.WORKING,
      label: "Working Day",
      cssKey: "working",
      color: CalendarEventColor.WORKING_COLOR,
    },
    {
      type: DayType.WORKING_HALF_DAY,
      label: "Half Day",
      cssKey: "working-half-day",
      color: CalendarEventColor.WORKING_HALF_DAY,
    },
    {
      type: DayType.NOT_WORKING,
      label: "Non-Working",
      cssKey: "not-working",
      color: CalendarEventColor.NOT_WORKING_COLOR,
    },
    {
      type: DayType.PUBLIC_HOLIDAY,
      label: "Public Holiday",
      cssKey: "public-holiday",
      color: CalendarEventColor.PUBLIC_HOLIDAY_COLOR,
    },
  ];

  private readonly modalService = inject(ModalService);
  private readonly calendarRepo = inject(CalendarRepo);
  private readonly calendarCustomService = inject(CalendarCustomService);
  private readonly handleMessage = inject(HandleToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadAllCalendarEvents();
  }

  beforeMonthViewRender(renderEvent: MonthViewBeforeRenderEvent): void {
    renderEvent.body.forEach((day) => {
      if (day.events.length > 0) {
        const dayType = day.events[0].title as DayType;
        day.cssClass = `day-type--${dayType.toLowerCase().replace(/_/g, "-")}`;
      } else {
        day.cssClass = "day-type--default";
      }
    });
  }

  clickedDay($event: {
    day: CalendarMonthViewDay;
    sourceEvent: MouseEvent | KeyboardEvent;
  }): void {
    const eventSelected = $event.day;
    const calendarItem: CalendarItem = {
      value: (eventSelected.events[0]?.title as DayType) ?? DayType.WORKING,
      date: format(eventSelected.date, "yyyy-MM-dd"),
      remark: eventSelected.events[0] ? eventSelected.events[0].meta : "",
    };
    const interval: Interval = {
      start: this.startDate,
      end: this.endDate,
    };
    if (isWithinInterval(calendarItem.date, interval)) {
      this.modalService
        .showEditCalendarEventModal(calendarItem)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.loadAllCalendarEvents();
        });
    } else {
      this.handleMessage.warningMessage(
        "This date is not in the current month",
      );
    }
  }

  loadAllCalendarEvents(): void {
    this.startDate = format(startOfMonth(this.viewDate), "yyyy-MM-dd");
    this.endDate = format(endOfMonth(this.viewDate), "yyyy-MM-dd");
    this.calendarRepo
      .getAllCalendarEvents(this.startDate, this.endDate)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((event) =>
          this.calendarCustomService.mappedToCalendarEvents(event),
        ),
      )
      .subscribe({
        next: (calendarEvents: CalendarEvent[]) =>
          this.events.set(calendarEvents),
        error: (error: unknown) => {
          this.handleMessage.handleErrorWithCodeV2(error);
        },
      });
  }
}
