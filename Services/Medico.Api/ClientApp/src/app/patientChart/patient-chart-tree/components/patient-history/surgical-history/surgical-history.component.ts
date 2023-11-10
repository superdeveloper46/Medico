import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { SurgicalHistory } from 'src/app/patientChart/models/surgicalHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { SurgicalHistoryService } from 'src/app/patientChart/patient-chart-tree/services/surgical-history.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { CptCodeService } from 'src/app/_services/cpt-code.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';

@Component({
  templateUrl: 'surgical-history.component.html',
  selector: 'surgical-history',
})
export class SurgicalHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('surgicalHistoryDataGrid', { static: false })
  surgicalHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('surgicalHistoryPopup', { static: false })
  surgicalHistoryPopup!: DxPopupComponent;
  @ViewChild('surgicalHistoryForm', { static: false })
  surgicalHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  isSurgicalHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedSurgicalHistory: Array<any> = [];
  surgicalHistory: any = new SurgicalHistory();

  isNewSurgicalHistory = true;
  surgicalHistoryDataSource: any = {};

  icdCodesDataSource: any = {};
  icdCodeArr?: Array<any>;
  isPhrasesHelperVisible = false;

  constructor(
    private alertService: AlertService,
    private surgicalHistoryService: SurgicalHistoryService,
    private dxDataUrlService: DxDataUrlService,
    private cptCodeService: CptCodeService,
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
    this.surgicalHistory.notes = content;
  }

  onSurgicalHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'cptCode' && fieldValue) {
      this.cptCodeService
        .getById(fieldValue)
        .then(cptCode => {
          this.surgicalHistory.diagnosis = cptCode.description;
          this.surgicalHistory.cptCode = '';
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.surgicalHistoryPopup);
  }

  deleteHistory(surgicalHistory: SurgicalHistory, $event: any) {
    $event.stopPropagation();

    const surgicalHistoryId = surgicalHistory.id;
    if (!surgicalHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.surgicalHistoryService.delete(surgicalHistoryId).then(() => {
          this.surgicalHistoryDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.setHistoryExistence();
  }

  openSurgicalHistoryForm() {
    this.isSurgicalHistoryPopupOpened = !this.isSurgicalHistoryPopupOpened;
    this.surgicalHistory = new SurgicalHistory();
  }

  onSurgicalHistoryPopupHidden() {
    this.isNewSurgicalHistory = true;
    this.selectedSurgicalHistory = [];
    this.surgicalHistory = new SurgicalHistory();
  }

  createUpdateSurgicalHistory() {
    if (!this.icdCodeArr) {
      console.log("no array:");
      console.log(this.icdCodeArr);
      return;
    }

    const validationResult = this.surgicalHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.surgicalHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.surgicalHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    this.surgicalHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      this.surgicalHistory.createDate
    );

    if (this.isNewSurgicalHistory) this.surgicalHistory.patientId = this.patientId;

    //this.surgicalHistory.notes = this.notesEditor.content;
    this.surgicalHistoryService
      .save(this.surgicalHistory, this.icdCodeArr)
      .then(() => {
        if (this.surgicalHistoryDataGrid && this.surgicalHistoryDataGrid.instance) {
          this.surgicalHistoryDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isSurgicalHistoryPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onSurgicalHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedSurgicalHistory = [];
      return;
    }

    const selectedSurgicalHistory = $event.selectedRowsData[0];
    if (!selectedSurgicalHistory) return;

    const selectedSurgicalHistoryId = selectedSurgicalHistory.id;

    this.surgicalHistoryService
      .getById(selectedSurgicalHistoryId)
      .then(surgicalHistory => {
        this.surgicalHistory = surgicalHistory;
        this.isSurgicalHistoryPopupOpened = true;
        this.isNewSurgicalHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initSurgicalHistoryDataSource();
    this.initCptCodeDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.PreviousSurgicalHistoryNode);
  }

  private setHistoryExistence() {
    this.surgicalHistoryService
      .isHistoryExist(this.patientId)
      .then(isHistoryExist => {
        this.isHistoryExist = isHistoryExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initSurgicalHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('surgicalhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.surgicalHistoryDataSource.store = appointmentStore;
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

  private initCptCodeDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('cptcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
    this.icdCodesDataSource.store.load().then(
      (data: any) => {
        this.icdCodeArr = data;
    })
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  contentChanged(_$event: any) {}
}
