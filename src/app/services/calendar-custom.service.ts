import { inject, Injectable } from "@angular/core";
import { CalendarEvent } from "angular-calendar";
import { CalendarDayTypePipe } from "../pipes/calendar-day-type.pipe";
import { CalendarItem, DayType } from "../../client/npiSeiko";

export interface DayTypeOptions {
  value: DayType;
  label: string;
  selected?: boolean;
}

export interface CustomCalendarItem extends CalendarItem {
  cssClass?: string;
}

@Injectable({
  providedIn: "root",
})
export class CalendarCustomService {
  private readonly calendarDayType = inject(CalendarDayTypePipe);

  mappedToCalendarEvents(calendarItems: CustomCalendarItem[]): CalendarEvent[] {
    return calendarItems.map((calendarItem) => {
      const itemWithClass: CustomCalendarItem = {
        ...calendarItem,
        cssClass: calendarItem.value,
      };
      return this.mappedToCalendarEvent(itemWithClass);
    });
  }

  initDaysTypeOption(): DayTypeOptions[] {
    return Object.values(DayType).map((type: DayType) => ({
      value: type,
      label: this.calendarDayType.transform(type),
      selected: false,
    }));
  }

  private mappedToCalendarEvent(
    calendarItem: CustomCalendarItem,
  ): CalendarEvent {
    return {
      title: calendarItem.value,
      meta: calendarItem?.remark ?? "",
      start: new Date(calendarItem.date),
      cssClass: calendarItem.cssClass,
    };
  }
}
