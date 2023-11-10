import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { TobaccoHistory } from 'src/app/patientChart/models/tobaccoHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { TobaccoHistoryService } from 'src/app/patientChart/patient-chart-tree/services/tobacco-history.service';
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
  templateUrl: 'tobacco-history.component.html',
  selector: 'tobacco-history',
})
export class TobaccoHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('tobaccoHistoryDataGrid', { static: false })
  tobaccoHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('tobaccoHistoryPopup', { static: false })
  tobaccoHistoryPopup!: DxPopupComponent;
  @ViewChild('tobaccoHistoryForm', { static: false })
  tobaccoHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  isPhrasesHelperVisible = false;

  get isDefaultHistoryValueSelected(): boolean {
    return this.tobaccoHistory.status === this.defaultHistoryValue;
  }

  canRenderComponent = false;

  isTobaccoHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedTobaccoHistory: Array<any> = [];
  tobaccoHistory = new TobaccoHistory();
  lastCreatedTobaccoHistory?: TobaccoHistory;

  isNewTobaccoHistory = true;
  tobaccoHistoryDataSource: any = {};

  constructor(
    private alertService: AlertService,
    private tobaccoHistoryService: TobaccoHistoryService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);

    this.init();
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.tobaccoHistory.notes = content;
  }

  get tobaccoUseStatusListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.tobaccoHistory.tobaccoUseStatus
    );
  }

  get tobaccoTypeListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.tobaccoHistory.tobaccoType
    );
  }

  get tobaccoUseListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.tobaccoHistory.tobaccoUse
    );
  }

  get durationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.duration
    );
  }

  get frequencyListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.frequency
    );
  }

  get quit(): boolean {
    return this.tobaccoHistory.quit;
  }

  set quit(quitValue: boolean) {
    this.tobaccoHistory.quit = quitValue;

    if (!quitValue) {
      this.tobaccoHistory.statusLength = undefined;
      this.tobaccoHistory.statusLengthType = undefined;
    }
  }

  onTobaccoHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    const defaultHistoryStatus =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.tobaccoHistory.tobaccoUseStatus
      );

    if (dataField === 'status' && fieldValue === defaultHistoryStatus) {
      this.resetTobaccoHistory();
    }
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.tobaccoHistoryPopup);
  }

  deleteHistory(tobaccoHistory: TobaccoHistory, $event: any) {
    $event.stopPropagation();
    const tobaccoHistoryId = tobaccoHistory.id;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    if (!tobaccoHistoryId) return;

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.tobaccoHistoryService.delete(tobaccoHistoryId).then(() => {
          this.setLatestTobaccoHistoryIfExists();
          this.tobaccoHistoryDataGrid.instance.refresh();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setLatestTobaccoHistoryIfExists();
  }

  openTobaccoHistoryForm() {
    this.isTobaccoHistoryPopupOpened = !this.isTobaccoHistoryPopupOpened;
    this.copyFromLastCreatedTobaccoHistory();
  }

  onTobaccoHistoryPopupHidden() {
    this.isNewTobaccoHistory = true;
    this.selectedTobaccoHistory = [];
    this.tobaccoHistory = new TobaccoHistory();
  }

  createUpdateTobaccoHistory() {
    const validationResult = this.tobaccoHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.tobaccoHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.tobaccoHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewTobaccoHistory) this.tobaccoHistory.patientId = this.patientId;

    this.tobaccoHistoryService
      .save(this.tobaccoHistory)
      .then(() => {
        if (this.tobaccoHistoryDataGrid && this.tobaccoHistoryDataGrid.instance) {
          this.tobaccoHistoryDataGrid.instance.refresh();
        }
        this.isHistoryExist = true;
        this.isNewTobaccoHistory = true;
        this.isTobaccoHistoryPopupOpened = false;

        this.setLatestTobaccoHistoryIfExists();
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onTobaccoHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedTobaccoHistory = [];
      return;
    }

    const selectedTobaccoHistory = $event.selectedRowsData[0];
    if (!selectedTobaccoHistory) return;

    const selectedTobaccoHistoryId = selectedTobaccoHistory.id;

    this.tobaccoHistoryService
      .getById(selectedTobaccoHistoryId)
      .then(tobaccoHistory => {
        this.tobaccoHistory = tobaccoHistory;
        this.isTobaccoHistoryPopupOpened = true;
        this.isNewTobaccoHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init() {
    this.initTobaccoHistoryDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.TobaccoHistoryNode);
  }

  private initSelectableLists() {
    const tobaccoUseStatusConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.tobaccoHistory.tobaccoUseStatus,
      LibrarySelectableListIds.tobaccoHistory.tobaccoUseStatus
    );

    const tobaccoTypeListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.tobaccoHistory.tobaccoType,
      LibrarySelectableListIds.tobaccoHistory.tobaccoType
    );

    const tobaccoUseListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.tobaccoHistory.tobaccoUse,
      LibrarySelectableListIds.tobaccoHistory.tobaccoUse
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
      tobaccoUseStatusConfig,
      tobaccoTypeListConfig,
      tobaccoUseListConfig,
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

  private copyFromLastCreatedTobaccoHistory() {
    if (this.lastCreatedTobaccoHistory) {
      this.tobaccoHistory.type = this.lastCreatedTobaccoHistory.type;
      this.tobaccoHistory.status = this.lastCreatedTobaccoHistory.status;
      this.tobaccoHistory.amount = this.lastCreatedTobaccoHistory.amount;
      this.tobaccoHistory.use = this.lastCreatedTobaccoHistory.use;
      this.tobaccoHistory.frequency = this.lastCreatedTobaccoHistory.frequency;
      this.tobaccoHistory.length = this.lastCreatedTobaccoHistory.length;
      this.tobaccoHistory.duration = this.lastCreatedTobaccoHistory.duration;
      this.tobaccoHistory.quit = this.lastCreatedTobaccoHistory.quit;
      this.tobaccoHistory.statusLength = this.lastCreatedTobaccoHistory.statusLength;
      this.tobaccoHistory.statusLengthType =
        this.lastCreatedTobaccoHistory.statusLengthType;
      this.tobaccoHistory.notes = this.lastCreatedTobaccoHistory.notes;
    }
  }

  private resetTobaccoHistory() {
    this.tobaccoHistory.type = undefined;
    this.tobaccoHistory.amount = undefined;
    this.tobaccoHistory.use = undefined;
    this.tobaccoHistory.frequency = undefined;
    this.tobaccoHistory.length = undefined;
    this.tobaccoHistory.duration = undefined;
    this.tobaccoHistory.quit = false;
    this.tobaccoHistory.statusLength = undefined;
    this.tobaccoHistory.statusLengthType = undefined;
  }

  private setLatestTobaccoHistoryIfExists() {
    this.tobaccoHistoryService.getLastCreated(this.patientId).then(tobaccoHistory => {
      this.lastCreatedTobaccoHistory = tobaccoHistory
        ? tobaccoHistory
        : new TobaccoHistory();

      this.isHistoryExist = !!tobaccoHistory;
    });
  }

  private initTobaccoHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('tobaccohistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.tobaccoHistoryDataSource.store = appointmentStore;
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

  contentChanged(_$event: any) {}
}
