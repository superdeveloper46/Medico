import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { LookupModel } from 'src/app/_models/lookupModel';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { AlertService } from 'src/app/_services/alert.service';
import { PhraseService } from 'src/app/administration/services/phrase.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';

@Component({
  templateUrl: 'phrase-suggestion-helper.component.html',
  selector: 'phrase-suggestion-helper',
})
export class PhraseSuggestionHelperComponent implements OnInit {
  @Input() companyId!: string;
  @Input() templateId?: string;
  @Input() patientChartNodeId?: string;

  @Input() keepFormat = false;

  @Input()
  set typedText(typedText: string) {
    if (!typedText) return;

    this.areSuggestionsVisible = this.suggestionRegex.test(typedText);

    if (this.areSuggestionsVisible) {
      this.text = typedText;
      this.setSuggestionSearchString(typedText);
      return;
    }

    this.resetPhraseSuggestionComponent();
  }

  @Output() phraseSuggestionApplied: EventEmitter<string> = new EventEmitter();

  @ViewChild('phraseGrid', { static: false })
  phraseGrid!: DxDataGridComponent;

  private text = '';
  private suggestionRegex = /((\.\.[^(. | \s)]*\w)|(\.\.))/;

  public areSuggestionsVisible = false;
  suggestionSearchString = '';

  phrasesDataSource: any = {};
  selectedPhrases: LookupModel[] = [];
  isPhrasePopupOpened = false;
  phraseContent: string = '';

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private alertService: AlertService,
    private phraseService: PhraseService,
    private devextremeAuthService: DevextremeAuthService,
    private selectableItemHtmlService: SelectableItemHtmlService
  ) {}

  insertPhraseContent() {
    let phraseContent = this.phraseContent || '';
    if (phraseContent) {
      if (!this.keepFormat) {
        phraseContent = this.cleanUpHtmlTags(phraseContent);
        phraseContent = this.cleanUpHtmlCodes(phraseContent);
      } else {
        phraseContent =
          this.selectableItemHtmlService.removeSelectableItemsAttributes(phraseContent);
      }
    }

    const typedText = this.text.replace(this.suggestionRegex, phraseContent);

    this.phraseSuggestionApplied.next(typedText);

    this.isPhrasePopupOpened = false;
    this.phraseContent = '';

    this.resetPhraseSuggestionComponent();
    this.areSuggestionsVisible = false;
  }

  onPhrasePopupHidden() {
    this.phraseContent = '';
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
          this.isPhrasePopupOpened = true;
          this.selectedPhrases = [];
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  closeSuggestionList() {
    const typedText = this.text.replace(this.suggestionRegex, '');
    this.phraseSuggestionApplied.next(typedText);

    this.resetPhraseSuggestionComponent();
    this.areSuggestionsVisible = false;
  }

  setSuggestionSearchString(typedText: string) {
    const suggestions = typedText.match(this.suggestionRegex);
    if (suggestions && suggestions.length) {
      const suggestion = suggestions[0];
      const suggestionString = suggestion.replace('..', '');

      this.suggestionSearchString = suggestionString;

      if (this.phraseGrid && this.phraseGrid.instance) {
        this.phraseGrid.instance.refresh();
      }
    }
  }

  onPhraseContentChanged($event: any) {
    this.phraseContent = $event;
  }

  onPhraseEditorReady() {}

  ngOnInit(): void {
    this.initPhrasesDataSource();
  }

  private initPhrasesDataSource(): void {
    this.phrasesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getEntityEndpointUrl(ApiBaseUrls.phrase),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
          jQueryAjaxSettings.data.templateId = this.templateId;
          jQueryAjaxSettings.data.patientChartNodeId = this.patientChartNodeId;

          if (this.suggestionSearchString) {
            jQueryAjaxSettings.data.filter = `["name", "startsWith", "${this.suggestionSearchString}"]`;
          }
        },
        this
      ),
    });
  }

  private resetPhraseSuggestionComponent() {
    this.text = '';
    this.suggestionSearchString = '';
  }

  private cleanUpHtmlTags(text: string): string {
    const htmlTagRegexp = new RegExp('<[^>]*>', 'g');
    return text.replace(htmlTagRegexp, '');
  }

  private cleanUpHtmlCodes(text: string): string {
    const htmlTagRegexp = new RegExp('&nbsp;', 'g');
    return text.replace(htmlTagRegexp, ' ');
  }
}
