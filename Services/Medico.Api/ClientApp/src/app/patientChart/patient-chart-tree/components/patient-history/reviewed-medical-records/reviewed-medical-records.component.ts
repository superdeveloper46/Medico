import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { MedicalRecord } from 'src/app/patientChart/models/medicalRecord';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicalRecordService } from 'src/app/patientChart/patient-chart-tree/services/medical-record.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';
import { IcdCodeService } from 'src/app/_services/icd-code.service';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { DxFileUploaderComponent } from 'devextreme-angular';

@Component({
  templateUrl: 'reviewed-medical-records.component.html',
  selector: 'reviewed-medical-records',
  styleUrls: ['./reviewed-medical-records.component.scss'],
})
export class ReviewedMedicalRecordsComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() patientId!: string;
  @Input() templateId?: string;
  @Input() patientChartNode!: PatientChartNode;

  @ViewChild('medicalRecordDataGrid', { static: false })
  medicalRecordDataGrid!: DxDataGridComponent;
  @ViewChild('medicalRecordPopup', { static: false })
  medicalRecordPopup!: DxPopupComponent;
  @ViewChild('medicalRecordForm', { static: false })
  medicalRecordForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;
  @ViewChild('pdfFileUploader', { static: false })
  pdfFileUploader!: DxFileUploaderComponent;

  fileTypes = [
    { id: '1', value: 'JSON' },
    { id: '2', value: 'XML' },
    { id: '3', value: 'CSV' },
    { id: '4', value: 'PDF' },
    { id: '5', value: 'ZIP' },
  ];
  subjectBoxEditorOptions: any;
  docData: any[] = [];
  canRenderComponent = false;
  isMedicalRecordPopupOpened = false;
  isHistoryExist = false;
  isNewMedicalRecord = true;

  medicalRecord: any = new MedicalRecord();
  medicalRecordDataSource: any = {};
  icdCodesDataSource: any = {};
  selectedMedicalRecord: Array<any> = [];

  notes = '';
  editor: any;
  editorId: string;
  initialContent: string = '';
  configData: any = {};
  isPhrasesHelperVisible = false;
  physianDataSource: any = {};
  toEmitIcdCodes: any = {};
  assessmentListValues: any[] = [];
  isPopupUploaderVisible: boolean = false;
  documentsFile: any[] = [];

  constructor(
    private repository: RepositoryService,
    private icdCodeService: IcdCodeService,
    private alertService: AlertService,
    private medicalRecordService: MedicalRecordService,
    private dxDataUrlService: DxDataUrlService,
    defaultValueService: DefaultValueService,
    private selectableListService: SelectableListService,
    private devextremeAuthService: DevextremeAuthService,
    private envService: EnvironmentUrlService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);
    this.editorId = GuidHelper.generateNewGuid();
    this.init();
    this.bindDoc();
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.medicalRecord.notes = content;
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.initialContent && this.editor) this.editor.setContent(this.initialContent);
  }

  onFormChanged($event: any): void {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'icdCode' && fieldValue) {
      this.icdCodeService
        .getById(fieldValue)
        .then(icdCode => {
          if (icdCode != null) {
            this.medicalRecord.diagnosis = icdCode.name;
            this.medicalRecord.icdCode = '';
          }
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
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

    this.icdCodesDataSource.store.load().then((data: any) => {
      this.toEmitIcdCodes = data;
    });
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.medicalRecordPopup);
  }

  deleteHistory(medicalRecord: MedicalRecord, $event: any) {
    $event.stopPropagation();

    const medicalRecordId = medicalRecord.id;
    if (!medicalRecordId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.medicalRecordService.delete(medicalRecordId).then(() => {
          this.medicalRecordDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  subjectMethod(_e: any): void {}

  ngOnInit(): void {
    this.initSelectableLists();
    this.initAssessmentListValues();
    this.setHistoryExistence();
    this.initIcdCodeDataSource();
    this.initPhysicianDataSource();

    this.subjectBoxEditorOptions = {
      items: this.docData,
      searchEnabled: true,
      value: '',
      displayExpr: 'value',
      valueExpr: 'value',
      onValueChanged: this.subjectMethod.bind(this),
    };
  }

  openMedicalRecordForm() {
    this.isMedicalRecordPopupOpened = !this.isMedicalRecordPopupOpened;
    //this.medicalRecord = [];
    this.medicalRecord = {};
  }

  onMedicalRecordPopupHidden() {
    this.resetForm();
  }

  createUpdateMedicalRecord() {
    const validationResult = this.medicalRecordForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.medicalRecord.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.medicalRecord.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewMedicalRecord) this.medicalRecord.patientId = this.patientId;
    this.medicalRecord.documents = this.documentsFile;
    //this.medicalRecord.notes = this.notesEditor.content;
    // this.medicalRecord.diagnosis = this.diagnosis;
    this.medicalRecordService
      .save(this.medicalRecord, this.toEmitIcdCodes)
      .then(() => {
        this.resetForm();

        if (this.medicalRecordDataGrid && this.medicalRecordDataGrid.instance) {
          this.medicalRecordDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isMedicalRecordPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private resetForm() {
    this.isNewMedicalRecord = true;
    this.selectedMedicalRecord = [];
    this.medicalRecord = new MedicalRecord();
  }

  onMedicalRecordSelect($event: any) {
    if (this.isSignedOff) {
      this.selectedMedicalRecord = [];
      return;
    }

    const selectedMedicalRecord = $event.selectedRowsData[0];
    if (!selectedMedicalRecord) return;

    const selectedMedicalRecordId = selectedMedicalRecord.id;

    this.medicalRecordService
      .getById(selectedMedicalRecordId)
      .then(medicalRecord => {
        this.medicalRecord = medicalRecord;
        if (this.notesEditor) this.notesEditor.insertContent(this.medicalRecord.notes);

        this.isMedicalRecordPopupOpened = true;
        this.isNewMedicalRecord = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  get associatedDocumentationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.scanDocuments.associatedDocumentation
    );
  }

  private init(): any {
    this.initMedicalRecordDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.ReviewedMedicalRecordsNode);
  }

  private initSelectableLists() {
    const associatedDocumentationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.scanDocuments.associatedDocumentation,
      LibrarySelectableListIds.scanDocuments.associatedDocumentation
    );

    const selectableLists = [associatedDocumentationListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initAssessmentListValues(): void {
    if (this.patientChartNode && this.patientChartNode.value.length > 0) {
      this.assessmentListValues = this.patientChartNode.value;
    }
  }

  private initMedicalRecordDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('medicalRecord'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.medicalRecordDataSource.store = appointmentStore;
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
    this.medicalRecordService
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

  closeForm() {
    this.resetForm();
    this.isMedicalRecordPopupOpened = false;
  }

  private initPhysicianDataSource(): void {
    this.physianDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  openUploader() {
    this.isPopupUploaderVisible = !this.isPopupUploaderVisible;
  }

  removeFile(file: File): void {
    const index = this.documentsFile.indexOf(file);
    if (index !== -1) {
      this.documentsFile.splice(index, 1);
    }
  }

  bindDoc() {
    const apiUrl = `selectable-lists/docs`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.docData = JSON.parse(res.data[0].jsonValues);
        } else {
          this.alertService.error(res.message);
        }
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
      },
    });
  }
}
