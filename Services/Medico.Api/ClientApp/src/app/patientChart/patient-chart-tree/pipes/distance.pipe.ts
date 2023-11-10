import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'distance' })
export class DistanceTransformPipe implements PipeTransform {
  transform(
    value: number | undefined,
    currentUnit: string,
    targetUnit: string
  ): number | undefined {
    if (value === undefined) return value;

    if (currentUnit == targetUnit) {
      return value;
    }

    const InchesToCentimeter = 2.54;

    if (targetUnit == 'inches') {
      if (currentUnit == 'cm') {
        return Math.round((value * 100) / InchesToCentimeter) / 100;
      }
    } else if (targetUnit == 'cm') {
      if (currentUnit == 'inches') {
        return Math.round(value * 100 * InchesToCentimeter) / 100;
      }
    }

    return value;
  }
}
