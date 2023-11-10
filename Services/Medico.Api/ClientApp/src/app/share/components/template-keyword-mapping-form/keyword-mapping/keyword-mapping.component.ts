import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { Component, Input, OnInit } from '@angular/core';
import { AlertService } from 'src/app/_services/alert.service';
import { ChiefComplaintService } from 'src/app/_services/chief-complaint.service';
import { KeywordEqualityComparerService } from 'src/app/_services/keyword-equality-comparer.service';

@Component({
  selector: 'keyword-mapping',
  templateUrl: './keyword-mapping.component.html',
})
export class KeywordMappingComponent extends BaseAdminComponent implements OnInit {
  @Input() chiefComplaintId!: string;
  @Input() newKeywordsToAdd!: string[];

  keywords: string[] = [];
  currentKeyword = '';

  constructor(
    private chiefComplaintService: ChiefComplaintService,
    private alertService: AlertService
  ) {
    super();
  }

  save(chiefComplaintId: string): Promise<void> {
    return this.chiefComplaintService.saveChiefComplaintKeywords(
      chiefComplaintId,
      this.keywords
    );
  }

  addNewKeyword(): void {
    if (!this.currentKeyword) return;

    const existedKeyword = this.keywords.filter(t => t === this.currentKeyword)[0];

    if (existedKeyword) return;

    this.keywords.push(this.currentKeyword);
    this.currentKeyword = '';
  }

  ngOnInit(): void {
    this.loadChiefComplaintKeywords();
  }

  private loadChiefComplaintKeywords() {
    if (!this.chiefComplaintId) {
      this.keywords = this.newKeywordsToAdd;
      return;
    }

    this.chiefComplaintService
      .getChiefComplaintKeywords(this.chiefComplaintId)
      .then(keywords => {
        if (keywords && keywords.length) this.keywords = keywords.map(k => k.value);

        if (this.newKeywordsToAdd && this.newKeywordsToAdd.length) {
          const notAddedNewKeywords = this.newKeywordsToAdd.filter(newKeyword => {
            if (!keywords.length) return true;

            const existingKeyword = this.keywords.find(k =>
              KeywordEqualityComparerService.areKeywordsEqual(k, newKeyword)
            );

            return !existingKeyword;
          });

          this.keywords = this.keywords.concat(notAddedNewKeywords);
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }
}
