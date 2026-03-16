import { Pipe, PipeTransform } from "@angular/core";
import { SupplierAndManufacturerType } from "../../client/costSeiko";

@Pipe({
  name: "supplierAndManufacturerType",
  standalone: true,
})
export class SupplierAndManufacturerTypePipe implements PipeTransform {
  transform(value: SupplierAndManufacturerType): string {
    switch (value) {
      case SupplierAndManufacturerType.SUPPLIER:
        return "Supplier";
      case SupplierAndManufacturerType.MANUFACTURER:
        return "Manufacturer";
      case SupplierAndManufacturerType.BOTH:
        return "Both";
      default:
        return "";
    }
  }
}
