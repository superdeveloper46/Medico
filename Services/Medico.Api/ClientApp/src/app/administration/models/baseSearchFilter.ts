import { ArrayHelper } from 'src/app/_helpers/array.helper';

export class BaseSearchFilter {
  toQueryParams(): any {
    const queryParams: any = {};
    const entityFilterFields = Object.keys(this);

    if (!entityFilterFields.length) return queryParams;

    for (let i = 0; i < entityFilterFields.length; i++) {
      const entityFilterField = entityFilterFields[i];
      const entityFilterFieldValue = (<any>this)[entityFilterField];

      queryParams[entityFilterField] = ArrayHelper.isArrayOfStrings(
        entityFilterFieldValue
      )
        ? entityFilterFieldValue.join(',')
        : entityFilterFieldValue;
    }

    return queryParams;
  }
}
