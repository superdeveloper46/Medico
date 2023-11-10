export class ArrayHelper {
  static groupBy(arr: any[], propName: string): any {
    return arr.reduce(function (rv, x) {
      (rv[x[propName]] = rv[x[propName]] || []).push(x);
      return rv;
    }, {});
  }

  static deleteByIndexes(arr: any[], indexes: number[]) {
    let shiftNumber = 0;
    indexes.forEach((i, index) => {
      const itemIndexToDelete = index ? i - shiftNumber : i;
      arr.splice(itemIndexToDelete, 1);
      shiftNumber += 1;
    });
  }

  static indexesOf(arr: object[], propName: string, propValues: any[]): number[] {
    const indexes: any[] = [];

    arr.forEach((i: any, index) => {
      const propValue = i[propName];
      if (propValues.indexOf(propValue) !== -1) {
        indexes.push(index);
      }
    });

    return indexes;
  }

  static isArrayOfStrings(value: any): boolean {
    if (value instanceof Array) {
      let somethingIsNotString = false;
      value.forEach(function (item) {
        if (typeof item !== 'string') {
          somethingIsNotString = true;
        }
      });

      return !somethingIsNotString && value.length > 0;
    }

    return false;
  }
}
