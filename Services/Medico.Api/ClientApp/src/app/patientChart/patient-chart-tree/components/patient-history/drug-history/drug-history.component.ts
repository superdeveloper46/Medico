import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DrugHistory } from 'src/app/patientChart/models/drugHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { DrugHistoryService } from 'src/app/patientChart/patient-chart-tree/services/drug-history.service';
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
  templateUrl: 'drug-history.component.html',
  selector: 'drug-history',
})
export class DrugHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('drugHistoryDataGrid', { static: false })
  drugHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('drugHistoryPopup', { static: false })
  drugHistoryPopup!: DxPopupComponent;
  @ViewChild('drugHistoryForm', { static: false })
  drugHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  get isDefaultHistoryValueSelected(): boolean {
    return this.drugHistory.status === this.defaultHistoryValue;
  }

  canRenderComponent = false;

  isDrugHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedDrugHistory: Array<any> = [];
  drugHistory: DrugHistory = new DrugHistory();
  lastCreatedDrugHistory?: DrugHistory;

  isNewDrugHistory = true;
  drugHistoryDataSource: any = {};
  isPhrasesHelperVisible = true;

  constructor(
    private alertService: AlertService,
    private drugHistoryService: DrugHistoryService,
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
    this.drugHistory.notes = content;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  get statusDrugUseListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.drugHistory.drugUseStatus
    );
  }

  get typeDrugListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.drugHistory.drugType
    );
  }

  get useDrugListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.drugHistory.drugUse
    );
  }

  get useDrugRouteListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.drugHistory.drugUseRoute
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
    return this.drugHistory.quit;
  }

  set quit(quitValue: boolean) {
    this.drugHistory.quit = quitValue;

    if (!quitValue) {
      this.drugHistory.statusLength = undefined;
      this.drugHistory.statusLengthType = undefined;
    }
  }

  onDrugHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    const defaultHistoryStatus =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.drugHistory.drugUse
      );

    if (dataField === 'status' && fieldValue === defaultHistoryStatus) {
      this.resetDrugHistory();
    }
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.drugHistoryPopup);
  }

  deleteHistory(drugHistory: DrugHistory, $event: any) {
    $event.stopPropagation();

    const drugHistoryId = drugHistory.id;
    if (!drugHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.drugHistoryService.delete(drugHistoryId).then(() => {
          this.setLatestDrugHistoryIfExists();
          this.drugHistoryDataGrid.instance.refresh();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setLatestDrugHistoryIfExists();
  }

  openDrugHistoryForm() {
    this.isDrugHistoryPopupOpened = !this.isDrugHistoryPopupOpened;
    this.copyFromLastCreatedDrugHistory();
  }

  onDrugHistoryPopupHidden() {
    this.isNewDrugHistory = true;
    this.selectedDrugHistory = [];
    this.drugHistory = new DrugHistory();
  }

  createUpdateDrugHistory() {
    const validationResult = this.drugHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.drugHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.drugHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewDrugHistory) this.drugHistory.patientId = this.patientId;

    // this.drugHistory.notes = this.notesEditor.content;
    this.drugHistoryService
      .save(this.drugHistory)
      .then(() => {
        if (this.drugHistoryDataGrid && this.drugHistoryDataGrid.instance) {
          this.drugHistoryDataGrid.instance.refresh();
        }
        this.isHistoryExist = true;
        this.isNewDrugHistory = true;
        this.isDrugHistoryPopupOpened = false;

        this.setLatestDrugHistoryIfExists();
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onDrugHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedDrugHistory = [];
      return;
    }

    const selectedDrugHistory = $event.selectedRowsData[0];
    if (!selectedDrugHistory) return;

    const selectedDrugHistoryId = selectedDrugHistory.id;

    this.drugHistoryService
      .getById(selectedDrugHistoryId)
      .then(drugHistory => {
        this.drugHistory = drugHistory;
        this.isDrugHistoryPopupOpened = true;
        this.isNewDrugHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initDrugHistoryDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.DrugHistoryNode);
  }

  private initSelectableLists() {
    const drugUseStatusListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.drugHistory.drugUseStatus,
      LibrarySelectableListIds.drugHistory.drugUseStatus
    );

    const drugTypeListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.drugHistory.drugType,
      LibrarySelectableListIds.drugHistory.drugType
    );

    const drugUseListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.drugHistory.drugUse,
      LibrarySelectableListIds.drugHistory.drugUse
    );

    const drugUseRouteListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.drugHistory.drugUseRoute,
      LibrarySelectableListIds.drugHistory.drugUseRoute
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
      drugUseStatusListConfig,
      drugTypeListConfig,
      drugUseListConfig,
      durationListConfig,
      frequencyListConfig,
      drugUseRouteListConfig,
    ];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private copyFromLastCreatedDrugHistory() {
    if (this.lastCreatedDrugHistory) {
      this.drugHistory.type = this.lastCreatedDrugHistory.type;
      this.drugHistory.route = this.lastCreatedDrugHistory.route;
      this.drugHistory.status = this.lastCreatedDrugHistory.status;
      this.drugHistory.amount = this.lastCreatedDrugHistory.amount;
      this.drugHistory.use = this.lastCreatedDrugHistory.use;
      this.drugHistory.frequency = this.lastCreatedDrugHistory.frequency;
      this.drugHistory.length = this.lastCreatedDrugHistory.length;
      this.drugHistory.duration = this.lastCreatedDrugHistory.duration;
      this.drugHistory.quit = this.lastCreatedDrugHistory.quit;
      this.drugHistory.statusLength = this.lastCreatedDrugHistory.statusLength;
      this.drugHistory.statusLengthType = this.lastCreatedDrugHistory.statusLengthType;
      this.drugHistory.notes = this.lastCreatedDrugHistory.notes;
    }
  }

  private resetDrugHistory() {
    this.drugHistory.type = undefined;
    this.drugHistory.amount = undefined;
    this.drugHistory.use = undefined;
    this.drugHistory.frequency = undefined;
    this.drugHistory.length = undefined;
    this.drugHistory.duration = undefined;
    this.drugHistory.quit = false;
    this.drugHistory.statusLength = undefined;
    this.drugHistory.statusLengthType = undefined;
    this.drugHistory.route = undefined;
  }

  private setLatestDrugHistoryIfExists() {
    this.drugHistoryService.getLastCreated(this.patientId).then(drugHistory => {
      this.lastCreatedDrugHistory = drugHistory ? drugHistory : new DrugHistory();

      this.isHistoryExist = !!drugHistory;
    });
  }

  private initDrugHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('drughistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.drugHistoryDataSource.store = appointmentStore;
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
