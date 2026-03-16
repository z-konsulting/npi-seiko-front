import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NumberFormatterService {
  constructor() {}

  static formatToTwoDecimalPlaces(value?: number, precision?: number): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return parseFloat(value.toFixed(precision ?? 2));
    }
    return 0;
  }
}
