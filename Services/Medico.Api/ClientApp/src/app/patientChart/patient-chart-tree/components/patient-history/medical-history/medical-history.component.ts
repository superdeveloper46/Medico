import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { MedicalHistory } from 'src/app/patientChart/models/medicalHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicalHistoryService } from 'src/app/patientChart/patient-chart-tree/services/medical-history.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { IcdCodeService } from 'src/app/_services/icd-code.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';

@Component({
  templateUrl: 'medical-history.component.html',
  selector: 'medical-history',
})
export class MedicalHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId!: string;

  @ViewChild('medicalHistoryDataGrid', { static: false })
  medicalHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('medicalHistoryPopup', { static: false })
  medicalHistoryPopup!: DxPopupComponent;
  @ViewChild('medicalHistoryForm', { static: false })
  medicalHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  isMedicalHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedMedicalHistory: Array<any> = [];
  medicalHistory: any = new MedicalHistory();

  isNewMedicalHistory = true;
  medicalHistoryDataSource: any = {};

  icdCodesDataSource: any = {};
  isPhrasesHelperVisible = false;
  icdCodeArr?: Array<any>;

  constructor(
    private alertService: AlertService,
    private medicalHistoryService: MedicalHistoryService,
    private dxDataUrlService: DxDataUrlService,
    private icdCodeService: IcdCodeService,
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

  onDetailedContentChanged(content: any) {
    this.medicalHistory.notes = content;
  }

  onMedicalHistoryFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'icdCode' && fieldValue) {
      this.icdCodeService
        .getById(fieldValue)
        .then(icdCode => {
          this.medicalHistory.diagnosis = icdCode.name;
          this.medicalHistory.icdCode = '';
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  ngAfterViewInit(): void {
    //this.registerEscapeBtnEventHandler(this.medicalHistoryPopup);
  }

  deleteHistory(medicalHistory: MedicalHistory, $event: any) {
    $event.stopPropagation();

    const medicalHistoryId = medicalHistory.id;
    if (!medicalHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.medicalHistoryService.delete(medicalHistoryId).then(() => {
          this.medicalHistoryDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.setHistoryExistence();
  }

  openMedicalHistoryForm() {
    this.isMedicalHistoryPopupOpened = !this.isMedicalHistoryPopupOpened;
    this.medicalHistory = new MedicalHistory();
  }

  onMedicalHistoryPopupHidden() {
    this.isNewMedicalHistory = true;
    this.selectedMedicalHistory = [];
    this.medicalHistory = new MedicalHistory();
  }

  createUpdateMedicalHistory() {
    if (!this.icdCodeArr) {
      console.log("no array:");
      console.log(this.icdCodeArr);
      return;
    }

    const validationResult = this.medicalHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.medicalHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.medicalHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewMedicalHistory) this.medicalHistory.patientId = this.patientId;

    //this.medicalHistory.notes = this.notesEditor.content;
    this.medicalHistoryService
      .save(this.medicalHistory, this.icdCodeArr)
      .then(() => {
        if (this.medicalHistoryDataGrid && this.medicalHistoryDataGrid.instance) {
          this.medicalHistoryDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isMedicalHistoryPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onMedicalHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedMedicalHistory = [];
      return;
    }

    const selectedMedicalHistory = $event.selectedRowsData[0];
    if (!selectedMedicalHistory) return;

    const selectedMedicalHistoryId = selectedMedicalHistory.id;

    this.medicalHistoryService
      .getById(selectedMedicalHistoryId)
      .then(medicalHistory => {
        this.medicalHistory = medicalHistory;
        this.isMedicalHistoryPopupOpened = true;
        this.isNewMedicalHistory = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initMedicalHistoryDataSource();
    this.initIcdCodeDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.PreviousMedicalHistoryNode);
  }

  private setHistoryExistence() {
    this.medicalHistoryService
      .isHistoryExist(this.patientId)
      .then(isHistoryExist => {
        this.isHistoryExist = isHistoryExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initMedicalHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('medicalhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.medicalHistoryDataSource.store = appointmentStore;
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

  private initIcdCodeDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('icdcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
    this.icdCodesDataSource.store.load().then( 
      (data: any) => {
        this.icdCodeArr = data
      });
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  contentChanged(_$event: any) {}
}
