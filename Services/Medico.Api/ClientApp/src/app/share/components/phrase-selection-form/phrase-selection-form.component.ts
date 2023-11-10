import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { PhraseService } from 'src/app/administration/services/phrase.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { LookupModel } from 'src/app/_models/lookupModel';
import { AlertService } from 'src/app/_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';

@Component({
  selector: 'phrase-selection-form',
  templateUrl: './phrase-selection-form.component.html',
})
export class PhraseSelectionFormComponent implements OnInit, AfterViewInit {
  @Input() companyId!: string;

  @Input()
  set typedText(typedText: string) {
    if (!typedText) return;

    const shouldPhrasesManagementPopupBeShown = this.suggestionRegex.test(typedText);

    if (!shouldPhrasesManagementPopupBeShown) return;

    if (shouldPhrasesManagementPopupBeShown) {
      this.text = typedText;

      this.isSearchPhrasesModeEnabled = true;
      this.isPhrasePopupOpened = true;
      return;
    }
  }

  @Output() phraseSuggestionApplied: EventEmitter<string> = new EventEmitter();

  @ViewChild('phraseGrid', { static: false })
  phraseGrid?: DxDataGridComponent;

  @ViewChild('phraseManagementPopup', { static: false })
  phraseManagementPopup!: DxPopupComponent;

  private text = '';
  private suggestionRegex = /\.\./;

  isSearchPhrasesModeEnabled = false;
  isPhrasesContentSelectionModeEnabled = false;

  phrasesDataSource: any = {};
  selectedPhrases: LookupModel[] = [];
  isPhrasePopupOpened = false;
  phraseContent: string = '';

  searchConfiguration: SearchConfiguration = new SearchConfiguration();

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private alertService: AlertService,
    private phraseService: PhraseService,
    private devextremeAuthService: DevextremeAuthService
  ) {}

  insertPhraseContent() {
    let phraseContent = this.phraseContent || '';

    if (phraseContent) {
      phraseContent = this.cleanUpHtmlTags(phraseContent);
      phraseContent = this.cleanUpHtmlCodes(phraseContent);
    }

    const typedText = this.text.replace(this.suggestionRegex, phraseContent);

    this.phraseSuggestionApplied.next(typedText);

    this.resetComponentState();

    this.isPhrasePopupOpened = false;
  }

  closePhraseManagementPopup() {
    const typedText = this.text.replace(this.suggestionRegex, '');

    this.phraseSuggestionApplied.next(typedText);

    this.resetComponentState();
    this.isPhrasePopupOpened = false;
  }

  onPhraseSelected($event: any) {
    const selectedPhrase = $event.selectedRowsData[0];
    if (!selectedPhrase) return;

    const selectedPhraseId = selectedPhrase.id;
    if (selectedPhraseId) {
      this.phraseService
        .getById(selectedPhraseId)
        .then(phrase => {
          this.phraseContent = phrase.contentWithDefaultSelectableItemsValues || '';
          this.isSearchPhrasesModeEnabled = false;
          this.isPhrasesContentSelectionModeEnabled = true;
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  backToPhraseSearch() {
    this.selectedPhrases = [];
    this.phraseContent = '';

    this.isSearchPhrasesModeEnabled = true;
    this.isPhrasesContentSelectionModeEnabled = false;
  }

  onPhraseContentChanged($event: any) {
    this.phraseContent = $event;
  }

  onPhraseEditorReady() {}

  ngOnInit() {
    this.initPhrasesDataSource();
  }

  ngAfterViewInit() {
    this.registerEscapeBtnEventHandler(this.phraseManagementPopup);
  }

  private initPhrasesDataSource() {
    this.phrasesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.phrase),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private cleanUpHtmlTags(text: string): string {
    const htmlTagRegexp = new RegExp('<[^>]*>', 'g');
    return text.replace(htmlTagRegexp, '');
  }

  private cleanUpHtmlCodes(text: string): string {
    const htmlTagRegexp = new RegExp('&nbsp;', 'g');
    return text.replace(htmlTagRegexp, ' ');
  }

  private resetComponentState() {
    this.phraseContent = '';
    this.text = '';
    this.selectedPhrases = [];

    this.isSearchPhrasesModeEnabled = false;
    this.isPhrasesContentSelectionModeEnabled = false;
  }

  private registerEscapeBtnEventHandler(popup: DxPopupComponent) {
    popup.instance.registerKeyHandler('escape', (event: any) => {
      event.stopPropagation();
    });
  }
}
