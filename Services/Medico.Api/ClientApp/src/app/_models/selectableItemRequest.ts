import { SelectableItemType } from './selectableItemType';
import { SelectableVariableType } from './selectableVariableType';

export class SelectableItemRequest {
  type?: SelectableItemType;
  selectableListId?: string;
  minRangeValue?: number;
  maxRangeValue?: number;
  dateFormat?: string;
  variableName?: string;
  variableType?: SelectableVariableType;
  variableInitialValue?: string;

  toQueryParams(): any {
    const queryParams = {};
    const entityFilterFields = Object.keys(this);

    if (!entityFilterFields.length) return queryParams;

    for (let i = 0; i < entityFilterFields.length; i++) {
      const entityFilterField = entityFilterFields[i];
      (<any>queryParams)[entityFilterField] = (<any>this)[entityFilterField];
    }

    return queryParams;
  }
}
