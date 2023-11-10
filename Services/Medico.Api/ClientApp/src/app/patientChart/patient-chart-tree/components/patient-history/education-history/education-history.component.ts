import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { EducationHistory } from 'src/app/patientChart/models/educationHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { EducationHistoryService } from 'src/app/patientChart/patient-chart-tree/services/education-history.service';
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
  templateUrl: 'education-history.component.html',
  selector: 'education-history',
})
export class EducationHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('educationHistoryDataGrid', { static: false })
  educationHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('educationHistoryPopup', { static: false })
  educationHistoryPopup!: DxPopupComponent;
  @ViewChild('educationHistoryForm', { static: false })
  educationHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  canRenderComponent = false;

  minCompletedYearNumber = 1950;
  maxCompletedYearNumber: number = new Date().getFullYear();

  isEducationHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedEducationHistory: Array<any> = [];
  educationHistory: any = new EducationHistory();

  isNewEducationHistory = true;

  educationHistoryDataSource: any = {};
  icdCodesDataSource: any = {};
  isPhrasesHelperVisible = false;

  constructor(
    private alertService: AlertService,
    private educationHistoryService: EducationHistoryService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);

    this.init();
  }

  onEducationHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'degreeSelectBoxValue' && fieldValue) {
      this.educationHistory.degree = fieldValue;
      this.educationHistory.degreeSelectBoxValue = '';
    }
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.educationHistory.notes = content;
  }

  get educationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.educationHistory.education
    );
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.educationHistoryPopup);
  }

  deleteHistory(educationHistory: EducationHistory, $event: any) {
    $event.stopPropagation();

    const educationHistoryId = educationHistory.id;
    if (!educationHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.educationHistoryService.delete(educationHistoryId).then(() => {
          this.educationHistoryDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setHistoryExistence();
    this.initDefaultHistoryValue(PatientChartNodeType.EducationNode);
  }

  openEducationHistoryForm() {
    this.isEducationHistoryPopupOpened = !this.isEducationHistoryPopupOpened;
    this.educationHistory = new EducationHistory();
  }

  onEducationHistoryPopupHidden() {
    this.isNewEducationHistory = true;
    this.selectedEducationHistory = [];
    this.educationHistory = new EducationHistory();
  }

  createUpdateEducationHistory() {
    const validationResult = this.educationHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.educationHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.educationHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewEducationHistory) this.educationHistory.patientId = this.patientId;

    //this.educationHistory.notes = this.notesEditor.content;
    this.educationHistoryService
      .save(this.educationHistory)
      .then(() => {
        if (this.educationHistoryDataGrid && this.educationHistoryDataGrid.instance) {
          this.educationHistoryDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isEducationHistoryPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onEducationHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedEducationHistory = [];
      return;
    }

    const selectedEducationHistory = $event.selectedRowsData[0];
    if (!selectedEducationHistory) return;

    const selectedEducationHistoryId = selectedEducationHistory.id;

    this.educationHistoryService
      .getById(selectedEducationHistoryId)
      .then(educationHistory => {
        this.educationHistory = educationHistory;
        this.isEducationHistoryPopupOpened = true;
        this.isNewEducationHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initEducationHistoryDataSource();
  }

  private initSelectableLists() {
    const educationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.educationHistory.education,
      LibrarySelectableListIds.educationHistory.education
    );

    const selectableLists = [educationListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initEducationHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('educationhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.educationHistoryDataSource.store = appointmentStore;
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

  private setHistoryExistence() {
    this.educationHistoryService
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
