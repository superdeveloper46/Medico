import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { PhraseService } from 'src/app/administration/services/phrase.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { LookupModel } from 'src/app/_models/lookupModel';
import { AlertService } from 'src/app/_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';

@Component({
  selector: 'template-phrase-usage-list',
  templateUrl: 'template-phrase-usage-list.component.html',
})
export class TemplatePhraseUsageListComponent implements OnInit {
  @Input() templatePhrasesUsage!: LookupModel[];
  @Input() companyId?: string;
  @Input() templateId?: string;

  phrasesDataSource: any = {};
  selectedPhrases: LookupModel[] = [];
  isPhrasePopupOpened = false;
  phraseContent: string = '';

  templatePhraseUsageDataSource: any = {};

  constructor(
    private devextremeAuthService: DevextremeAuthService,
    private dxDataUrlService: DxDataUrlService,
    private alertService: AlertService,
    private phraseService: PhraseService
  ) {}

  onPhrasePopupHidden() {
    this.phraseContent = '';
  }

  onPhraseContentChanged($event: any) {
    this.phraseContent = $event;
  }

  ngOnInit(): void {
    this.initTemplatePhraseUsageDataSource();
    this.initPhrasesDataSource();
  }

  onTemplatePhraseAdded($event: any) {
    const selectedPhrase = $event.itemData;

    if (!selectedPhrase) return;

    const selectedPhraseId = selectedPhrase.id;
    const alreadyAddedPhrase = this.templatePhrasesUsage.find(
      p => p.id === selectedPhraseId
    );

    if (alreadyAddedPhrase) {
      this.alertService.warning(`Template ${selectedPhrase.name} is already added`);
      return;
    }

    this.templatePhrasesUsage.push(selectedPhrase);
  }

  phrasePopupOpen(_$event: any, selectedPhraseId: string) {
    if (!selectedPhraseId) return;

    if (selectedPhraseId) {
      this.phraseService
        .getById(selectedPhraseId)
        .then(phrase => {
          this.phraseContent = phrase.contentWithDefaultSelectableItemsValues || '';
          this.isPhrasePopupOpened = true;
          this.selectedPhrases = [];
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  private initPhrasesDataSource(): void {
    this.phrasesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.phrase),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
          jQueryAjaxSettings.data.templateId = this.templateId;
        },
        this
      ),
    });
  }

  private initTemplatePhraseUsageDataSource(): void {
    this.templatePhraseUsageDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.phrase),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }
}
