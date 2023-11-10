import { Component, Output, EventEmitter } from '@angular/core';
import { BaseSelectableRangeComponent } from '../../classes/baseSelectableRangeComponent';
import { IPatientSelectableComponent } from '../../classes/iPatientSelectableComponent';
import { SelectableItem } from '../../classes/selectableItem';
import { SelectableItemHtmlService } from '../../../_services/selectable-item-html.service';
import { AlertService } from 'src/app/_services/alert.service';
import { BaseSelectableComponent } from '../../classes/baseSelectableComponent';

@Component({
  templateUrl: 'patient-selectable-range.component.html',
  selector: 'patient-selectable-range',
})
export class PatientSelectableRangeComponent
  extends BaseSelectableRangeComponent
  implements IPatientSelectableComponent
{
  private _selectableItem: Nullable<SelectableItem> = null;

  @Output()
  selectableItemChanged: EventEmitter<Array<SelectableItem>> = new EventEmitter();

  rangeValue = 0;
  minRangeValue = 0;
  maxRangeValue = 0;

  isPreviewMode = false;

  visible = false;

  constructor(
    private selectableItemHtmlService: SelectableItemHtmlService,
    private alertService: AlertService
  ) {
    super();
  }

  get selectableItem(): Nullable<SelectableItem> {
    return this._selectableItem;
  }

  set selectableItem(selectableItem: Nullable<SelectableItem>) {
    this._selectableItem = selectableItem;
    if (this._selectableItem) {
      const metadata = this.getMetadata(this._selectableItem.metadata);
      this.minRangeValue = metadata.minRangeValue;
      this.maxRangeValue = metadata.maxRangeValue;
      this.rangeValue = 0;
    }
  }

  saveSelectbleItemChanges() {
    if (this.selectableItem) {
      this.selectableItem.value = this.rangeValue.toString();
      this.selectableItemChanged.next([this.selectableItem]);
    }
  }

  getSelectableItems(htmlContent: string): Promise<Array<SelectableItem>> {
    const selectableItems = this.selectableItemHtmlService.getSelectableItems(
      htmlContent,
      [this.selectableType],
      undefined,
      selectableItem => {
        return !!selectableItem.value.match(selectableItem.metadata);
      }
    );
    if (!selectableItems || !selectableItems.length) {
      return Promise.resolve([]);
    }

    const results: Array<SelectableItem> = [];

    for (let i = 0; i < selectableItems.length; i++) {
      const selectableItem = selectableItems[i];
      const metadataCode = selectableItem.metadata;
      const id = selectableItem.id;

      const selectableItemMetadata = this.getMetadata(metadataCode);
      const minRageValue = selectableItemMetadata.minRangeValue;
      results.push(new SelectableItem(id, metadataCode, minRageValue));
    }

    return Promise.resolve(results);
  }

  get selectableComponent(): BaseSelectableComponent {
    return this;
  }
}
