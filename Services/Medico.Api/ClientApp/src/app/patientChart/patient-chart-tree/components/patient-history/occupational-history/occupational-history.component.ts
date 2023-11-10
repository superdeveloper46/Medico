import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { OccupationalHistory } from 'src/app/patientChart/models/occupationalHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { OccupationalHistoryService } from 'src/app/patientChart/patient-chart-tree/services/occupational-history.service';
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
  templateUrl: 'occupational-history.component.html',
  selector: 'occupational-history',
})
export class OccupationalHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() patientId!: string;
  @Input() templateId?: string;

  @ViewChild('occupationalHistoryDataGrid', { static: false })
  occupationalHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('occupationalHistoryPopup', { static: false })
  occupationalHistoryPopup!: DxPopupComponent;
  @ViewChild('occupationalHistoryForm', { static: false })
  occupationalHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  currentDate = new Date();
  minOccupationalDate = new Date(1900, 1, 1);

  canRenderComponent = false;

  isOccupationalHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedOccupationalHistory: any[] = [];
  occupationalHistory: any = new OccupationalHistory();

  isNewOccupationalHistory = true;

  occupationalHistoryDataSource: any = {};
  icdCodesDataSource: any = {};
  isPhrasesHelperVisible = false;

  constructor(
    private alertService: AlertService,
    private occupationalHistoryService: OccupationalHistoryService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);

    this.init();
  }

  onStartDateBoxFocusOut() {
    this.occupationalHistoryForm.instance.validate();
  }

  onEndDateBoxFocusOut() {
    this.occupationalHistoryForm.instance.validate();
  }

  validateStartDate(params: any) {
    const startDate = params.value;
    if (!startDate) return true;

    const endDate = this.occupationalHistory.end;
    if (!endDate) return true;

    return startDate < endDate;
  }

  validateEndDate(params: any) {
    const endDate = params.value;
    if (!endDate) return true;

    const startDate = this.occupationalHistory.start;
    if (!startDate) return true;

    return startDate < endDate;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.occupationalHistory.notes = content;
  }

  get occupationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.occupationalHistory.occupation
    );
  }

  get employmentStatusListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.occupationalHistory.employmentStatus
    );
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.occupationalHistoryPopup);
  }

  deleteHistory(occupationalHistory: OccupationalHistory, $event: any) {
    $event.stopPropagation();

    const occupationalHistoryId = occupationalHistory.id;
    if (!occupationalHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.occupationalHistoryService.delete(occupationalHistoryId).then(() => {
          this.occupationalHistoryDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  onOccupationalHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'hasDisabilityClaim' && !fieldValue) {
      this.occupationalHistory.disabilityClaimDetails = null;
    }

    if (dataField === 'hasWorkersCompensationClaim' && !fieldValue) {
      this.occupationalHistory.workersCompensationClaimDetails = null;
    }

    if (dataField === 'occupationalTypeSelectBoxValue' && fieldValue) {
      this.occupationalHistory.occupationalType = fieldValue;
      this.occupationalHistory.occupationalTypeSelectBoxValue = '';
    }
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setHistoryExistence();
  }

  openOccupationalHistoryForm() {
    this.isOccupationalHistoryPopupOpened = !this.isOccupationalHistoryPopupOpened;
    this.occupationalHistory = new OccupationalHistory();
  }

  onOccupationalHistoryPopupHidden() {
    this.isNewOccupationalHistory = true;
    this.selectedOccupationalHistory = [];
    this.occupationalHistory = new OccupationalHistory();

    this.occupationalHistory.hasDisabilityClaim = false;
    this.occupationalHistory.hasWorkersCompensationClaim = false;
  }

  createUpdateOccupationalHistory() {
    const validationResult = this.occupationalHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.occupationalHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.occupationalHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewOccupationalHistory)
      this.occupationalHistory.patientId = this.patientId;

    this.occupationalHistory.notes = this.notesEditor.content;
    this.occupationalHistoryService
      .save(this.occupationalHistory)
      .then(() => {
        if (
          this.occupationalHistoryDataGrid &&
          this.occupationalHistoryDataGrid.instance
        ) {
          this.occupationalHistoryDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isOccupationalHistoryPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getOccupationalDays(gridItem: any) {
    if (!gridItem.start || !gridItem.end) return '';

    const startDate = new Date(gridItem.start);
    const endDate = gridItem.end ? new Date(gridItem.end) : new Date();

    return DateHelper.getDaysBetween(startDate, endDate);
  }

  onOccupationalHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedOccupationalHistory = [];
      return;
    }

    const selectedOccupationalHistory = $event.selectedRowsData[0];
    if (!selectedOccupationalHistory) return;

    const selectedOccupationalHistoryId = selectedOccupationalHistory.id;

    this.occupationalHistoryService
      .getById(selectedOccupationalHistoryId)
      .then(occupationalHistory => {
        this.occupationalHistory = occupationalHistory;

        this.occupationalHistory.hasDisabilityClaim =
          !!this.occupationalHistory.disabilityClaimDetails;

        this.occupationalHistory.hasWorkersCompensationClaim =
          !!this.occupationalHistory.workersCompensationClaimDetails;

        this.isOccupationalHistoryPopupOpened = true;
        this.isNewOccupationalHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initOccupationalHistoryDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.OccupationalHistoryNode);

    this.occupationalHistory.hasDisabilityClaim = false;
    this.occupationalHistory.hasWorkersCompensationClaim = false;
  }

  private initSelectableLists() {
    const occupationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.occupationalHistory.occupation,
      LibrarySelectableListIds.occupationalHistory.occupation
    );

    const employmentStatusListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.occupationalHistory.employmentStatus,
      LibrarySelectableListIds.occupationalHistory.employmentStatus
    );

    const selectableLists = [employmentStatusListConfig, occupationListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initOccupationalHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('occupationalhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.occupationalHistoryDataSource.store = appointmentStore;
    this.applyDecoratorForDataSourceLoadFunc(appointmentStore);
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(item => {
          item.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.createDate);
          item.start = DateHelper.sqlServerUtcDateToLocalJsDate(item.start);

          if (item.end) item.end = DateHelper.sqlServerUtcDateToLocalJsDate(item.end);
        });
        return result;
      });
    };
  }

  private setHistoryExistence() {
    this.occupationalHistoryService
      .isHistoryExist(this.patientId)
      .then(isHistoryExist => {
        this.isHistoryExist = isHistoryExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  contentChanged(_$event: any) {}
}
