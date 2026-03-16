import { Pipe, PipeTransform } from "@angular/core";
import { CostingMethodType } from "../../client/costSeiko";

@Pipe({
  name: "crMethodType",
  standalone: true,
})
export class CRMethodTypePipe implements PipeTransform {
  transform(value: CostingMethodType): string {
    switch (value) {
      case CostingMethodType.HV:
        return "HV";
      case CostingMethodType.BUDGETARY:
        return "Budgetary";
      case CostingMethodType.NPI:
        return "NPI";
      case CostingMethodType.LV:
        return "LV";
      default:
        return "";
    }
  }
}
