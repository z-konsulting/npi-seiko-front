import { inject, Injectable } from "@angular/core";
import { Calendar, CalendarItem } from "../../client/npiSeiko";
import { fromRequest } from "../services/utils/api-utils";
import { Observable } from "rxjs";
import { CustomCalendarItem } from "../services/calendar-custom.service";

@Injectable({
  providedIn: "root",
})
export class CalendarRepo {
  private readonly calendarService = inject(Calendar);

  getAllCalendarEvents(
    startDate: string,
    endDate: string,
  ): Observable<CustomCalendarItem[]> {
    return fromRequest(
      this.calendarService.getCalendarSlice({
        query: {
          startDate,
          endDate,
        },
      }),
    );
  }

  updateCalendarEvent(calendarItem: CalendarItem): Observable<unknown> {
    return fromRequest(
      this.calendarService.upsertCalendarEntry({
        body: calendarItem,
      }),
    );
  }
}
