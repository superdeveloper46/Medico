import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { AlcoholHistory } from 'src/app/patientChart/models/alcoholHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { AlcoholHistoryService } from 'src/app/patientChart/patient-chart-tree/services/alcohol-history.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';

@Component({
  templateUrl: 'alcohol-history.component.html',
  selector: 'alcohol-history',
})
export class AlcoholHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('alcoholHistoryDataGrid', { static: false })
  alcoholHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('alcoholHistoryPopup', { static: false })
  alcoholHistoryPopup!: DxPopupComponent;
  @ViewChild('alcoholHistoryForm', { static: false })
  alcoholHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  get isDefaultHistoryValueSelected(): boolean {
    return this.alcoholHistory.status === this.defaultHistoryValue;
  }

  canRenderComponent = false;
  isAlcoholHistoryPopupOpened = false;
  isHistoryExist = false;
  selectedAlcoholHistory: Array<any> = [];
  alcoholHistory: AlcoholHistory = new AlcoholHistory();
  lastCreatedAlcoholHistory?: AlcoholHistory;
  isNewAlcoholHistory = true;
  alcoholHistoryDataSource: any = {};
  isPhrasesHelperVisible = false;

  constructor(
    private alertService: AlertService,
    private alcoholHistoryService: AlcoholHistoryService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);

    this.init();
  }

  onDetailedContentChanged(content: string) {
    this.alcoholHistory.notes = content;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  get statusEtohUseListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.alcoholHistory.alcoholUseStatus
    );
  }

  get typeAlcoholListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.alcoholHistory.alcoholType
    );
  }

  get useAlcoholListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.alcoholHistory.alcoholUse
    );
  }

  get durationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.duration
    );
  }

  get useFrequencyListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.frequency
    );
  }

  get quit(): boolean {
    return this.alcoholHistory.quit;
  }

  set quit(quitValue: boolean) {
    this.alcoholHistory.quit = quitValue;

    if (!quitValue) {
      this.alcoholHistory.statusLength = undefined;
      this.alcoholHistory.statusLengthType = undefined;
    }
  }

  onAlcoholHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    const defaultHistoryStatus =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.alcoholHistory.alcoholUseStatus
      );

    if (dataField === 'status' && fieldValue === defaultHistoryStatus) {
      this.resetAlcoholHistory();
    }
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.alcoholHistoryPopup);
  }

  deleteHistory(alcoholHistory: AlcoholHistory, $event: any) {
    $event.stopPropagation();

    const alcoholHistoryId = alcoholHistory.id;
    if (!alcoholHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.alcoholHistoryService.delete(alcoholHistoryId).then(() => {
          this.setLatestAlcoholHistoryIfExists();
          this.alcoholHistoryDataGrid.instance.refresh();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setLatestAlcoholHistoryIfExists();
  }

  openAlcoholHistoryForm() {
    this.isAlcoholHistoryPopupOpened = !this.isAlcoholHistoryPopupOpened;
    this.copyFromLastCreatedAlcoholHistory();
  }

  onAlcoholHistoryPopupHidden() {
    this.isNewAlcoholHistory = true;
    this.selectedAlcoholHistory = [];
    this.alcoholHistory = new AlcoholHistory();
  }

  createUpdateAlcoholHistory() {
    const validationResult = this.alcoholHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.alcoholHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.alcoholHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewAlcoholHistory) this.alcoholHistory.patientId = this.patientId;

    //this.alcoholHistory.notes = this.notesEditor.content;
    this.alcoholHistoryService
      .save(this.alcoholHistory)
      .then(() => {
        if (this.alcoholHistoryDataGrid && this.alcoholHistoryDataGrid.instance) {
          this.alcoholHistoryDataGrid.instance.refresh();
        }
        this.isHistoryExist = true;
        this.isNewAlcoholHistory = true;
        this.isAlcoholHistoryPopupOpened = false;

        this.setLatestAlcoholHistoryIfExists();
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onAlcoholHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedAlcoholHistory = [];
      return;
    }

    const selectedAlcoholHistory = $event.selectedRowsData[0];
    if (!selectedAlcoholHistory) return;

    const selectedAlcoholHistoryId = selectedAlcoholHistory.id;

    this.alcoholHistoryService
      .getById(selectedAlcoholHistoryId)
      .then(alcoholHistory => {
        this.alcoholHistory = alcoholHistory;
        this.isAlcoholHistoryPopupOpened = true;
        this.isNewAlcoholHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init() {
    this.initAlcoholHistoryDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.AlcoholHistoryNode);
  }

  private initSelectableLists() {
    const statusAlcoholUseListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.alcoholHistory.alcoholUseStatus,
      LibrarySelectableListIds.alcoholHistory.alcoholUseStatus
    );

    const typeAlcoholListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.alcoholHistory.alcoholType,
      LibrarySelectableListIds.alcoholHistory.alcoholType
    );

    const useAlcoholListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.alcoholHistory.alcoholUse,
      LibrarySelectableListIds.alcoholHistory.alcoholUse
    );

    const durationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.duration,
      LibrarySelectableListIds.application.duration
    );

    const frequencyListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.frequency,
      LibrarySelectableListIds.application.frequency
    );

    const selectableLists = [
      statusAlcoholUseListConfig,
      typeAlcoholListConfig,
      useAlcoholListConfig,
      durationListConfig,
      frequencyListConfig,
    ];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private copyFromLastCreatedAlcoholHistory() {
    if (this.lastCreatedAlcoholHistory) {
      this.alcoholHistory.type = this.lastCreatedAlcoholHistory.type;
      this.alcoholHistory.status = this.lastCreatedAlcoholHistory.status;
      this.alcoholHistory.amount = this.lastCreatedAlcoholHistory.amount;
      this.alcoholHistory.use = this.lastCreatedAlcoholHistory.use;
      this.alcoholHistory.frequency = this.lastCreatedAlcoholHistory.frequency;
      this.alcoholHistory.length = this.lastCreatedAlcoholHistory.length;
      this.alcoholHistory.duration = this.lastCreatedAlcoholHistory.duration;
      this.alcoholHistory.quit = this.lastCreatedAlcoholHistory.quit;
      this.alcoholHistory.statusLength = this.lastCreatedAlcoholHistory.statusLength;
      this.alcoholHistory.statusLengthType =
        this.lastCreatedAlcoholHistory.statusLengthType;
      this.alcoholHistory.notes = this.lastCreatedAlcoholHistory.notes;
    }
  }

  private resetAlcoholHistory() {
    this.alcoholHistory.type = undefined;
    this.alcoholHistory.amount = undefined;
    this.alcoholHistory.use = undefined;
    this.alcoholHistory.frequency = undefined;
    this.alcoholHistory.length = undefined;
    this.alcoholHistory.duration = undefined;
    this.alcoholHistory.quit = false;
    this.alcoholHistory.statusLength = undefined;
    this.alcoholHistory.statusLengthType = undefined;
  }

  private setLatestAlcoholHistoryIfExists() {
    this.alcoholHistoryService.getLastCreated(this.patientId).then(alcoholHistory => {
      this.lastCreatedAlcoholHistory = alcoholHistory
        ? alcoholHistory
        : new AlcoholHistory();

      this.isHistoryExist = !!alcoholHistory;
    });
  }

  private initAlcoholHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('alcoholhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.alcoholHistoryDataSource.store = appointmentStore;
    this.applyDecoratorForDataSourceLoadFunc(appointmentStore);
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(item => {
          item.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.createDate);
        });
        return result;
      });
    };
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }
}
