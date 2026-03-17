import { Pipe, PipeTransform } from "@angular/core";
import { UserType } from "../../../client/npiSeiko";

@Pipe({
  name: "userType",
})
export class UserTypePipe implements PipeTransform {
  transform(value: UserType): string {
    switch (value) {
      case UserType.EMAIL_ADDRESS:
        return "Email Address";
      case UserType.USERNAME:
        return "Username";
      default:
        return "Unknown";
    }
  }
}
