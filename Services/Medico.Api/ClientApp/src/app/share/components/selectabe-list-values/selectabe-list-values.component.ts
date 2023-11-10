import { Component, Input } from '@angular/core';
import { SelectableListValue } from 'src/app/_models/selectableListValue';
import { GuidHelper } from 'src/app/_helpers/guid.helper';

@Component({
  selector: 'selectabe-list-values',
  templateUrl: './selectabe-list-values.component.html',
})
export class SelectabeListValuesComponent {
  @Input()
  selectableListValues!: SelectableListValue[];

  constructor() {

    this.validateSelectableListValue = this.validateSelectableListValue.bind(this);
  }

  onSelectableListValueRemoved($event: any) {
    const selectableListValueIdToRemove = $event.data.Id;

    let index = -1;
    for (let i = 0; i < this.selectableListValues.length; i++) {
      const selectableListValue = this.selectableListValues[i];
      if (selectableListValue.id === selectableListValueIdToRemove) {
        index = i;
      }
    }

    if (index !== -1) {
      this.selectableListValues.splice(index, 1);
    }
  }

  validateSelectableListValue(params: any) {
    const selectableListValue = params.value;
    const selectableListItemWithSameValue = this.selectableListValues.filter(
      l => l.value.toUpperCase() === selectableListValue.toUpperCase()
    )[0];
    if (!selectableListItemWithSameValue) {
      return true;
    }

    return !selectableListItemWithSameValue
      ? true
      : selectableListItemWithSameValue.id === params.data.id;
  }

  onInitNewSelectableListValue($event: any) {
    $event.data = new SelectableListValue();
    $event.data.isDefault = false;
    $event.data.id = GuidHelper.generateNewGuid();
  }

  onSelectableListValueInserting($event: any) {
    const id = $event.key;
    const selectableListValue = $event.data;

    selectableListValue.isDefault = !!selectableListValue.isDefault;

    if (selectableListValue.isDefault) {
      this.changeIsDefaultPropertyIfNeeded(id);
    }

    selectableListValue.description =
      selectableListValue.description || selectableListValue.value;
  }

  onSelectableListValueUpdated($event: any) {
    const id = $event.key.id;
    const changedSelectableListValue: any = this.selectableListValues.find(
      li => li.id === id
    );

    const changedData = $event.data;
    const isDefault = changedData.isDefault;

    for (const prop in changedData) {
      if (Object.prototype.hasOwnProperty.call(changedData, prop)) {
        changedSelectableListValue[prop] = changedData[prop];
      }
    }

    if (isDefault) {
      this.changeIsDefaultPropertyIfNeeded(id);
    }
  }

  private changeIsDefaultPropertyIfNeeded(changedSelectableListValueId: string): any {
    const defualtSelectableListValue = this.selectableListValues.filter(
      li => li.isDefault && li.id !== changedSelectableListValueId
    )[0];

    if (defualtSelectableListValue) {
      defualtSelectableListValue.isDefault = false;
    }
  }
}
