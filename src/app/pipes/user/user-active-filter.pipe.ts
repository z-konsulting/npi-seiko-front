import { Pipe, PipeTransform } from "@angular/core";
import { ActiveFilter } from "../../../client/npiSeiko";

@Pipe({
  name: "userActiveFilter",
})
export class UserActiveFilterPipe implements PipeTransform {
  transform(value: ActiveFilter): string {
    switch (value) {
      case ActiveFilter.ACTIVE_ONLY:
        return "Active";
      case ActiveFilter.INACTIVE_ONLY:
        return "Inactive";
      case ActiveFilter.ALL:
        return "All";
      default:
        return "All";
    }
  }
}
