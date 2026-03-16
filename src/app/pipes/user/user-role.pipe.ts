import { Pipe, PipeTransform } from "@angular/core";
import { UserRole } from "../../../client/costSeiko";

@Pipe({
  name: "userRole",
})
export class UserRolePipe implements PipeTransform {
  transform(value: UserRole): string {
    switch (value) {
      case UserRole.PROJECT_MANAGER:
        return "Project Manager";
      case UserRole.ENGINEERING:
        return "Engineering";
      case UserRole.MANAGEMENT:
        return "Management";
      case UserRole.PLANNING:
        return "Planning";
      case UserRole.PROCUREMENT:
        return "Procurement";
      case UserRole.ADMINISTRATOR:
        return "Administrator";
      case UserRole.SUPER_ADMINISTRATOR:
        return "Super Admin";
      default:
        return "Unknown";
    }
  }
}
