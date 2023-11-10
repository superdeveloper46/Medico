import { Component, Output, EventEmitter } from '@angular/core';
import { BaseSelectableDateComponent } from '../../classes/baseSelectableDateComponent';
import { IPatientSelectableComponent } from '../../classes/iPatientSelectableComponent';
import { SelectableItem } from '../../classes/selectableItem';
import { AlertService } from 'src/app/_services/alert.service';
import { SelectableItemHtmlService } from '../../../_services/selectable-item-html.service';
import { BaseSelectableComponent } from '../../classes/baseSelectableComponent';
import * as moment from 'moment';

@Component({
  templateUrl: 'patient-selectable-date.component.html',
  selector: 'patient-selectable-date',
})
export class PatientSelectableDateComponent
  extends BaseSelectableDateComponent
  implements IPatientSelectableComponent
{
  @Output()
  selectableItemChanged: EventEmitter<Array<SelectableItem>> = new EventEmitter();

  private _selectableItem: Nullable<SelectableItem> = null;

  dateFormat = '';
  date = '';

  isPreviewMode = false;

  visible = false;

  constructor(
    private alertService: AlertService,
    private selectableItemHtmlService: SelectableItemHtmlService
  ) {
    super();
  }

  get selectableComponent(): BaseSelectableComponent {
    return this;
  }

  set selectableItem(selectableItem: Nullable<SelectableItem>) {
    this._selectableItem = selectableItem;
    if (this._selectableItem) {
      this.dateFormat = this.getMetadata(this._selectableItem.metadata);

      if (this.date) this.date = '';
    }
  }

  get selectableItem() {
    return this._selectableItem;
  }

  saveSelectbleItemChanges() {
    const dateFormatRegex = this.dateFormats.filter(
      df => df.format.toUpperCase() === this.dateFormat.toUpperCase()
    )[0].regex;
    if (!this.date || !this.date.match(new RegExp(dateFormatRegex))) {
      this.alertService.error('Invaid date format');
      return;
    } else if (this.selectableItem) {
      this.selectableItem.value = this.date;
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
      const date = moment().format(selectableItemMetadata);

      results.push(new SelectableItem(id, metadataCode, date));
    }

    return Promise.resolve(results);
  }
}
