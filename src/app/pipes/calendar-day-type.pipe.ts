import { Injectable, Pipe, PipeTransform } from "@angular/core";
import { DayType } from "../../client/npiSeiko";

@Pipe({
  name: "calendarDayType",
})
@Injectable({ providedIn: "root" })
export class CalendarDayTypePipe implements PipeTransform {
  transform(value?: DayType): string {
    switch (value) {
      case DayType.WORKING:
        return "Working";
      case DayType.NOT_WORKING:
        return "Not Working";
      case DayType.WORKING_HALF_DAY:
        return "Working (Half Day)";
      default:
        return "Public holiday";
    }
  }
}
