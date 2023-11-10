import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'weight' })
export class WeightTransformPipe implements PipeTransform {
  transform(value: number, currentUnit: string, targetUnit: string): number {
    if (currentUnit == targetUnit) {
      return value;
    }

    const KgToPound = 2.20462;

    if (targetUnit == 'lbs') {
      if (currentUnit == 'kg') {
        return Math.round(value * 100 * KgToPound) / 100;
      }
    } else if (targetUnit == 'kg') {
      if (currentUnit == 'lbs') {
        return Math.round((value * 100) / KgToPound) / 100;
      }
    }

    return value;
  }
}
