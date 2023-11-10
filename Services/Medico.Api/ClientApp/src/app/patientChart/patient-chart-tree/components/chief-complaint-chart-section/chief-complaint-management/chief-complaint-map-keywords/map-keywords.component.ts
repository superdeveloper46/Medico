import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ChiefComplaintKeywordService } from 'src/app/_services/chief-complaint-keyword.service';
import { ArrayHelper } from 'src/app/_helpers/array.helper';
import { KeywordEqualityComparerService } from 'src/app/_services/keyword-equality-comparer.service';

type ChiefComplaintWithKeywords = {
  id: string;
  title: string;
  matchedKeywords: string[];
  missedKeywords: string[];
};

@Component({
  templateUrl: 'map-keywords.component.html',
  selector: 'map-keywords',
})
export class ChiefComplaintMapKeywordsComponent {
  private _allegationsString = '';

  @Input() companyId!: string;

  @Input()
  get allegations(): string {
    return this._allegationsString;
  }
  set allegations(allegations: string) {
    this._allegationsString = allegations;
    this.loadMatchedChiefComplaintKeywords();
  }

  @Output() templatesAdded: EventEmitter<any> = new EventEmitter();

  @ViewChild('matchedKeywordsGrid', { static: false })
  matchedKeywordsGrid!: DxDataGridComponent;

  _delimiter = ',';
  matchedChiefComplaintKeywords: Array<any> = [];

  canAddMissedKeywords = false;
  missedKeywordsData: any = {
    chiefComplaintId: '',
    missedKeywords: [],
  };

  canAddTemplates = false;
  templatesData: any = {
    chiefComplaintId: '',
  };

  matchedKeywordsExist = false;

  get allegationsList(): string[] {
    if (!this.allegations) {
      return [];
    }

    return this.splitString(this.allegations);
  }

  constructor(private chiefComplaintKeywordService: ChiefComplaintKeywordService) {}

  addMissedKeywords(chiefComplaintId: string, missedKeywords: string) {
    this.missedKeywordsData.chiefComplaintId = chiefComplaintId;
    this.missedKeywordsData.missedKeywords = missedKeywords;

    this.canAddMissedKeywords = true;
  }

  onMissedKeywordsCanceled() {
    this.canAddMissedKeywords = false;
    this.resetMissedKeywordsData();
  }

  onMissedKeywordsAdded() {
    this.canAddMissedKeywords = false;
    this.resetMissedKeywordsData();
    this.loadMatchedChiefComplaintKeywords();
  }

  addTemplates(chiefComplaintId: string) {
    this.templatesData.chiefComplaintId = chiefComplaintId;
    this.canAddTemplates = true;
  }

  onTemplatesCanceled() {
    this.canAddTemplates = false;
    this.resetTemplatesData();
  }

  onTemplatesAdded($event: any) {
    this.canAddTemplates = false;
    this.resetTemplatesData();
    this.templatesAdded.next($event);
  }

  private loadMatchedChiefComplaintKeywords() {
    this.chiefComplaintKeywordService
      .getByKeywords(this.allegationsList, this.companyId)
      .then(chiefComplaintKeywords => {
        if (!chiefComplaintKeywords.length) {
          return;
        }

        this.matchedChiefComplaintKeywords =
          this.adjustChiefComplaintKeywords(chiefComplaintKeywords);

        this.matchedKeywordsExist = true;
      });
  }

  private adjustChiefComplaintKeywords(chiefComplaints: Array<any>): any[] {
    if (chiefComplaints && !chiefComplaints.length) {
      return [];
    }

    const chiefComplaintsGroupedById = ArrayHelper.groupBy(chiefComplaints, 'id');

    const chiefComplaintsResult = [];

    for (const chiefComplaintId in chiefComplaintsGroupedById) {
      if (
        Object.prototype.hasOwnProperty.call(chiefComplaintsGroupedById, chiefComplaintId)
      ) {
        const chiefComplaintWithKeywords: ChiefComplaintWithKeywords = {
          id: chiefComplaintId,
          title: '',
          matchedKeywords: [],
          missedKeywords: [],
        };

        const groupedChiefComplaints = chiefComplaintsGroupedById[chiefComplaintId];

        chiefComplaintWithKeywords.title = groupedChiefComplaints[0].title;

        const keywords = groupedChiefComplaints.map((cc: any) => cc.value);

        const missedKeywords = this.getMissedKeywords(keywords);

        chiefComplaintWithKeywords.matchedKeywords = keywords;
        chiefComplaintWithKeywords.missedKeywords = missedKeywords;

        chiefComplaintsResult.push(chiefComplaintWithKeywords);
      }
    }
    return chiefComplaintsResult;
  }

  private getMissedKeywords(keywords: string[]): string[] {
    return this.allegationsList.reduce((missedKeywords: string[], allegation) => {
      const existingKeyword = keywords.find(k =>
        KeywordEqualityComparerService.areKeywordsEqual(k, allegation)
      );

      if (!existingKeyword) missedKeywords.push(allegation);

      return missedKeywords;
    }, []);
  }

  private splitString(str: string): string[] {
    return str.split(this._delimiter).map(a => a.trim());
  }

  private resetMissedKeywordsData() {
    this.missedKeywordsData.chiefComplaintId = '';
    this.missedKeywordsData.missedKeywords = [];
  }

  private resetTemplatesData(): any {
    this.templatesData.chiefComplaintId = '';
  }
}
