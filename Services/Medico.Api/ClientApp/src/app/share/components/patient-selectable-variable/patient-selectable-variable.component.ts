import { Component, Output, EventEmitter } from '@angular/core';
import { IPatientSelectableComponent } from '../../classes/iPatientSelectableComponent';
import { SelectableItem } from '../../classes/selectableItem';
import { BaseSelectableVariableComponent } from '../../classes/baseSelectableVariableComponent';
import { BaseSelectableComponent } from '../../classes/baseSelectableComponent';
import { SelectableVariableType } from 'src/app/_models/selectableVariableType';
import { AlertService } from 'src/app/_services/alert.service';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';

@Component({
  templateUrl: 'patient-selectable-variable.component.html',
  selector: 'patient-selectable-variable',
})
export class PatientSelectableVariableComponent
  extends BaseSelectableVariableComponent
  implements IPatientSelectableComponent
{
  @Output()
  selectableItemChanged: EventEmitter<SelectableItem[]> = new EventEmitter();

  private _selectableItem: Nullable<SelectableItem> = null;
  private variableType: Nullable<SelectableVariableType>;

  variableValue: any;

  get isTextVariable(): boolean {
    return this.variableType === SelectableVariableType.Text;
  }

  get isNumericVariable(): boolean {
    return this.variableType === SelectableVariableType.Numeric;
  }

  isPreviewMode = false;
  visible = false;

  get selectableItem() {
    return this._selectableItem;
  }

  set selectableItem(selectableItem: Nullable<SelectableItem>) {
    this._selectableItem = selectableItem;
    if (this._selectableItem) {
      const metadata = this.getMetadata(this._selectableItem.metadata);
      this.variableType = metadata.variableType;
      this.variableValue = this._selectableItem.value;
    }
  }

  constructor(
    private alertService: AlertService,
    private selectableItemHtmlService: SelectableItemHtmlService
  ) {
    super();
  }

  saveSelectbleItemChanges() {
    if (!this.variableValue) {
      this.alertService.error('Variable value is required');
      return;
    } else if (this.selectableItem) {
      this.selectableItem.value = this.variableValue;
      this.selectableItemChanged.next([this.selectableItem]);
    }
  }

  getSelectableItems(htmlContent: string): Promise<SelectableItem[]> {
    const selectableItems = this.selectableItemHtmlService.getSelectableItems(
      htmlContent,
      [this.selectableType],
      undefined
    );
    if (!selectableItems || !selectableItems.length) {
      return Promise.resolve([]);
    }

    const results: Array<SelectableItem> = [];

    for (let i = 0; i < selectableItems.length; i++) {
      const selectableItem = selectableItems[i];
      const metadataCode = selectableItem.metadata;
      const id = selectableItem.id;

      results.push(new SelectableItem(id, metadataCode, 'variable'));
    }

    return Promise.resolve(results);
  }

  get selectableComponent(): BaseSelectableComponent {
    return this;
  }
}
