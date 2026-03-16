import { formatDate } from "date-fns";

export class RegexPatterns {
  // Strictly positive integers
  static readonly POSITIVE_INTEGER = "^[1-9][0-9]*$";
  static readonly POSITIVE_INTEGER_NO_ZERO = "^0*[1-9][0-9]*$";

  static readonly INTEGER = "^[0-9][0-9]*$";
  static readonly EN_DATE_FORMAT = "yyyy-MM-dd";
  static readonly EN_DATE_PICKER_FORMAT = "yy-mm-dd";
  static readonly CHIP_SEPARATOR = /[ ,]+/;
  // Positive decimal numbers without 0
  static readonly POSITIVE_DECIMAL_NO_ZERO = /^(?!0+(?:\.0+)?$)\d+(\.\d+)?$/;
  // Positive decimal numbers
  static readonly POSITIVE_DECIMAL = /^(\d+)(\.\d+)?$/;
  static readonly STRING_NO_SPACE = /\S/;

  // Email addresses
  static readonly EMAIL = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

  static checkPositiveDecimalValid(value: any) {
    const regex = new RegExp(RegexPatterns.POSITIVE_DECIMAL_NO_ZERO);
    if (value && value != "") {
      return regex.test(value.toString());
    }
    return false;
  }

  static checkPositiveIntegerValid(value: any) {
    const regex = new RegExp(RegexPatterns.POSITIVE_INTEGER);
    if (value && value != "") {
      return regex.test(value.toString());
    }
    return false;
  }

  static checkStringValid(value: any) {
    const regex = new RegExp(RegexPatterns.STRING_NO_SPACE);
    if (value && value != "") {
      return regex.test(value.toString());
    }
    return false;
  }

  static emailValid(value: any) {
    const regex = new RegExp(RegexPatterns.EMAIL);
    if (value) {
      return regex.test(value.toString());
    }
    return false;
  }

  static enDateFormatToString(value: Date): string | null {
    return value ? formatDate(value, RegexPatterns.EN_DATE_FORMAT) : null;
  }
}
