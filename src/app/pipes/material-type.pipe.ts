import { Pipe, PipeTransform } from "@angular/core";
import { MaterialType } from "../../client/costSeiko";

@Pipe({
  name: "materialType",
})
export class MaterialTypePipe implements PipeTransform {
  transform(value: MaterialType): string {
    switch (value) {
      case MaterialType.DIRECT:
        return "Direct";
      case MaterialType.INDIRECT:
        return "Indirect";
      default:
        return "Unknown";
    }
  }
}
