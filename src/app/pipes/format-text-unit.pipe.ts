import { Pipe, PipeTransform } from '@angular/core';
import { NumberFormatterService } from '../services/utils/number-formatter.service';

@Pipe({
  name: 'formatTextUnit',
})
export class FormatTextUnitPipe implements PipeTransform {
  constructor() {}

  transform(value: number | string, unit?: string, precision?: number): string {
    const unitValue: string = unit ?? '';
    if (typeof value === 'string') {
      return `${value} ${unitValue}`;
    } else {
      if (value) {
        return `${NumberFormatterService.formatToTwoDecimalPlaces(value, precision)} ${unitValue}`;
      } else {
        return `0 ${unitValue}`;
      }
    }
  }
}
