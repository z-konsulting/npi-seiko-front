import { Pipe, PipeTransform } from "@angular/core";
import { MaterialStatus } from "../../client/costSeiko";

@Pipe({
  name: "materialStatus",
  standalone: true,
})
export class MaterialStatusPipe implements PipeTransform {
  transform(value: MaterialStatus): string {
    switch (value) {
      case MaterialStatus.TO_BE_ESTIMATED:
        return "TO BE ESTIMATED";
      case MaterialStatus.ESTIMATED:
        return "ESTIMATED";
      default:
        return "";
    }
  }
}
