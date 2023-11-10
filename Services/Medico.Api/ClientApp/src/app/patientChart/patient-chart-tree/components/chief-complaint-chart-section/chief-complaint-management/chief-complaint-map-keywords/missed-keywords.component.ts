import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { ChiefComplaintKeywordService } from 'src/app/_services/chief-complaint-keyword.service';
import { AlertService } from 'src/app/_services/alert.service';

type KeywordsType = string[] | undefined;

@Component({
  templateUrl: 'missed-keywords.component.html',
  selector: 'missed-keywords',
})
export class MissedKeywordsComponent implements AfterViewInit {
  @Input() chiefComplaintId!: string;
  @Input() missedKeywords!: Array<string>;

  @Output() missedKeywordsAdded: EventEmitter<KeywordsType> = new EventEmitter();
  @Output() missedKeywordsCanceled: EventEmitter<KeywordsType> = new EventEmitter();

  @ViewChild('missedKeywordsPopup', { static: false })
  missedKeywordsPopup!: DxPopupComponent;
  @ViewChild('missedKeywordsList', { static: false })
  missedKeywordsList!: DxListComponent;

  constructor(
    private chiefComplaintKeywordService: ChiefComplaintKeywordService,
    private alertService: AlertService
  ) {}

  ngAfterViewInit(): void {
    this.missedKeywordsPopup.instance.show();
  }

  saveMissedKeywords() {
    const selectedMissedKeywords = this.missedKeywordsList.selectedItems;
    if (!selectedMissedKeywords.length) {
      this.missedKeywordsCanceled.next(undefined);
      return;
    }

    this.chiefComplaintKeywordService
      .addKeywords(this.chiefComplaintId, selectedMissedKeywords)
      .then(() => {
        this.missedKeywordsAdded.next(undefined);
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  cancelMissedKeywords() {
    this.missedKeywordsCanceled.next(undefined);
  }
}
