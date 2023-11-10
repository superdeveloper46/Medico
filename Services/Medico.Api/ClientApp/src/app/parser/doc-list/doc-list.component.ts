import { Component, ViewChild } from '@angular/core';
import { MedicationUpdateService } from 'src/app/administration/services/medication-update.service';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { AlertService } from 'src/app/_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import {
  DxDataGridComponent,
  DxFileUploaderComponent,
  DxFormComponent,
  DxPopupComponent,
} from 'devextreme-angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { Patient } from 'src/app/patients/models/patient';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { MaskList } from 'src/app/_classes/maskList';
import { StateList } from 'src/app/_classes/stateList';
import { Gender } from 'src/app/_classes/gender';
import { MaritalStatus } from 'src/app/patients/classes/maritalStatus';
import { ZipCodeTypeList } from 'src/app/_classes/zipCodeTypeList';
import { PatientInsurance } from 'src/app/patients/models/patientInsurance';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { formatDate } from '@angular/common';
import { RepositoryService } from 'src/app/_services/repository.service';
import * as data from '../line.json';

@Component({
  selector: 'app-doc-list',
  templateUrl: './doc-list.component.html',
  styleUrls: ['./doc-list.component.sass'],
})
export class DocListComponent {
  @ViewChild('patientDataGrid', { static: false })
  patientDataGrid!: DxDataGridComponent;
  @ViewChild('medicationUpdatePopup', { static: false })
  medicationUpdatePopup!: DxPopupComponent;
  @ViewChild('medicationsPdfFileUploader', { static: false })
  medicationsPdfFileUploader!: DxFileUploaderComponent;
  @ViewChild('patientForm', { static: false })
  patientForm!: DxFormComponent;
  @ViewChild('insuranceForm', { static: false })
  insuranceForm!: DxFormComponent;
  @ViewChild('appointmentForm', { static: false })
  appointmentForm!: DxFormComponent;

  selectedDocument: any;
  selectedPatients: Array<any> = [];
  patientDataSource: any = {};
  isPatientPopupOpened = false;
  // claimants: any = [];//= (data as any).default;
  claimants: any = (data as any).default;
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  response: any;

  appointment: any = {};
  appointmentNew: any = {};
  selectedCategories: Array<any> = [];
  isNewMedicationUpdate = true;
  medicationUpdateDataSource: any = {};
  isMedicationUpdatePopupOpened = false;
  loading = false;
  documentId = '';
  showClaimants = false;
  message = '';
  message2 = '';
  patientTab: any = { id: 1, title: 'Patient  Info', template: 'patient' };
  patientAppointmentsTab: any = {
    id: 2,
    title: 'Appointment Info',
    template: 'appointments',
  };
  patientDataTabs: Array<any> = [];
  patient: Patient;
  insurance: PatientInsurance;
  selectedAppointmentStatus: string = '';
  companyManagementTabs: Array<any> = [];
  selectedTabIndex = 0;
  regexRuleList: RegexRuleList = new RegexRuleList();
  private isNewInsurance = true;
  private isNewPatient = true;
  validationMasks: MaskList = new MaskList();
  states: any[] = StateList.values;
  gender: any[] = Gender.values;
  maritalStatus: any[] = MaritalStatus.values;
  zipCodeTypes: any[] = ZipCodeTypeList.values;
  zip = '';
  physician = '';
  apptDate = '';
  apptTime = '';
  patientId: any;
  physianDataSource: any = {};
  locationDataSource: any = {};
  roomDataSource: any = {};
  nurseDataSource: any = {};
  selectedLocationId: string = GuidHelper.emptyGuid;
  startDate: any;
  endDate: any;

  get appointmentStatuses(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.appointmentStatus
    );
  }

  get patientSuffixListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.patientSuffix
    );
  }

  get genderString(): string {
    if (!this.patient.gender) return '';

    return this.gender.find(g => g.value === this.patient.gender).name;
  }

  get zipMask(): string {
    switch (this.patient.zipCodeType) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      case ZipCodeType.NineDigit:
        return this.validationMasks.nineDigitZip;
    }
  }

  get zipMaskInsurance(): string {
    switch (this.insurance.zipCodeType) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      // case ZipCodeType.NineDigit:
      default:
        return this.validationMasks.nineDigitZip;
    }
  }

  constructor(
    private companyIdService: CompanyIdService,
    private selectableListService: SelectableListService,
    private repository: RepositoryService,
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private medicationUpdateService: MedicationUpdateService,
    private appointmentService: AppointmentService,
    private router: Router,
    private devextremeAuthService: DevextremeAuthService
  ) {
    this.patient = new Patient();
    this.insurance = new PatientInsurance();

    this.init();
    this.initCompanyManagementTabs();
  }

  private initCompanyManagementTabs() {
    this.companyManagementTabs = [
      {
        id: 0,
        text: 'Patient Info',
      },
      {
        id: 1,
        text: 'Appointment Info',
      },
    ];
  }

  onTabSelect($event: any) {
    if (this.selectedTabIndex !== $event.itemIndex)
      this.selectedTabIndex = $event.itemIndex;
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  refreshPatientsGrid() {
    this.patientDataGrid.instance.refresh();
  }

  openMedicationUpdateForm() {
    this.isMedicationUpdatePopupOpened = true;
  }

  onPatientSelected($event: any) {
    const documentSelectedRow = $event.selectedRowsData[0];

    if (!documentSelectedRow) return;

    this.documentId = documentSelectedRow.documentId;
    this.isPatientPopupOpened = true;
    this.fetchDoc(documentSelectedRow);
  }

  onPatientPopupHidden() {
    // this.patient = new Patient();
    // this.insurance = new PatientInsurance();
    // this.selectedPatients = [];
    // this.patientDataTabs = [];
    // this.isNewPatient = true;
    // this.isNewInsurance = true;
  }

  uploadFile() {
    const medicationsFile = this.medicationsPdfFileUploader.value[0];
    if (!medicationsFile) {
      this.alertService.warning('You have to upload PDF file');
      return;
    }
    /************** TEST MODE *****************/
    // this.documentId = "xxxxxxxxxxxxxx";
    // this.isMedicationUpdatePopupOpened = false;
    /************** END TEST MODE *****************/

    this.medicationUpdateService
      .uploadFile(medicationsFile, this.parsers[0])
      .then(c => {
        this.response = c;
        this.documentId = this.response.id;
        this.message = `Document has been uploaded successfully. Please wait for sometime for the document to process.`;

        this.isMedicationUpdatePopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  fetchDoc(documentSelectedRow: any) {
    try {
      this.showClaimants = true;
      this.loading = true;

      /************** TEST MODE *****************/
      // this.claimants = (data as any).default;
      // this.loading = false;
      /************** END TEST MODE *****************/

      let parserId = documentSelectedRow.parserId; //'okjfiogvcpwz';
      if (documentSelectedRow.fileExt === '.tif') {
        parserId = 'ghaxpeejfkdn';
      }
      this.repository
        .fetchDoc(parserId, this.documentId)
        .then((c: any) => {
          if (c == null || c == undefined) {
            this.alertService.error('There was some error');
          }
          this.claimants = c;
          this.previewData(documentSelectedRow.fileExt);
          this.loading = false;
        })
        .catch(_c => {
          this.alertService.error('Please wait for the document to process.');
        });
    } catch (e) {
      this.alertService.error(
        'The document could not be fetched. Please try after some time.'
      );
    }
  }

  fetchAllDocs(parserId: string) {
    this.repository.fetchAllDocs(parserId).subscribe({
      next: res => {
        this.claimants = res.filter(
          (c: any) => c.processed_at >= '2021-06-04T20:10:43+00:00'
        );
        this.loading = false;
        // this.claimants = this.claimants.slice(0, 3);
        this.message = `Retreived ${this.claimants.length} new documents from DocParser. Saving to DB`;

        this.initDocumentSave(parserId);
        // setTimeout(() => {
        //     this.initDocumentSave(parserId);
        // }, 3000);
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  // fetchUploadedDoc() {
  //     try {
  //         const url = 'https://medicophysicians-staging.azurewebsites.net/uploads/PDF2_ForOCR.pdf';
  //         this.repository.fetchUploadedDoc(url, '1').then((c: any) => {

  //             if (c == null || c == undefined) {
  //                 this.alertService.error('There was some error');
  //             }
  //             console.log(c);
  //             this.documentId = c.id;
  //         }).catch(c => {
  //             this.alertService.error('Please wait for the document to process.');
  //         });
  //     }
  //     catch (e) {
  //         this.alertService.error('The document could not be fetched. Please try after some time.');
  //     }
  // }

  previewData(ext: string) {
    this.loading = true;
    let apiUrl = `dataParser/extractInfo/${this.companyId}`;
    if (ext === '.tif') {
      apiUrl = `dataParser/extractInfoExt/${this.companyId}`;
    }
    this.repository.create(apiUrl, this.claimants[0]).subscribe({
      next: res => {
        if (res.success) {
          // state
          // var st = this.states.filter(c => c.name == res.data.stateName)[0];

          const patientInfo = res.data;
          this.zip = patientInfo.zip;
          patientInfo.gender = 4;
          patientInfo.maritalStatus = 5;
          patientInfo.state = 'Arizona';
          // if (st != null) {
          //     patientInfo.state = st.value;
          // }

          patientInfo.state = 3;

          this.patient = patientInfo as Patient;
          this.insurance = patientInfo as PatientInsurance;

          // labels only
          this.appointment = {
            physician: patientInfo.physician,
            apptDate: patientInfo.apptDate,
            apptTime: patientInfo.apptTime,
            examLocation: patientInfo.examLocation,
            allegations: patientInfo.allegations,
          };

          // Text Boxes
          this.appointmentNew.apptTime = patientInfo.apptTime;
          this.appointmentNew.dateOfApp = patientInfo.apptDate;

          this.isPatientPopupOpened = true;
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        //this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  createUpdatePatient(_$event: any) {
    this.loading = true;
    const apiUrl = `dataParser/company/${this.companyId}`;
    this.repository.create(apiUrl, this.patient).subscribe({
      next: res => {
        if (res.success) {
          this.patientId = res.data;
          this.message2 = res.message;
          this.isTabVisible(1);
          this.selectedTabIndex = 1;
          //this.router.navigateByUrl('patients-management');
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  createAppointment() {
    // this.patientId = '03D39B9A-FE5B-1133-2DCE-3C0BCDE4386E';
    if (!this.patientId) {
      this.alertService.warning('Please save Patient first');
      return;
    }

    let d = formatDate(this.appointmentNew.dateOfApp, 'MM/dd/yyyy', 'en-US');
    d = d + ' ' + this.appointmentNew.apptTime;
    //console.log(d);
    d = DateHelper.jsLocalDateToSqlServerUtc(d);

    const dataToPost: any = {
      allegations: this.appointment.allegations,
      allDay: false,
      appointmentStatus: 'Scheduled',
      companyId: this.companyId,
      endDate: d,
      locationId: this.appointmentNew.location,
      nurseId: this.appointmentNew.nurse,
      patientId: this.patientId,
      physicianId: this.appointmentNew.physician,
      roomId: this.appointmentNew.room,
      startDate: d,
      text: this.appointment.allegations,
    };

    this.appointmentService.save(dataToPost).then(_c => {
      this.alertService.info('Appointment saved');
      // this.initProcessedDocsDataSource();
      // this.router.navigateByUrl('/appointments');
      this.isPatientPopupOpened = false;
      this.reloadGrid();
    });
  }

  //parsers = ['rojtyduogbem', 'ghaxpeejfkdn'];
  parsers = ['okjfiogvcpwz', 'ghaxpeejfkdn'];

  private init(): any {
    this.subscribeToCompanyIdChanges();

    // this.fetchAllDocs('okjfiogvcpwz'); // PDF Parser
    //this.fetchAllDocs(); // New Doc Parser
    //this.fetchAllDocs(); // TIF Parser

    for (let i = 0; i < this.parsers.length; i++) {
      this.fetchAllDocs(this.parsers[i]);
    }

    this.initProcessedDocsDataSource();
  }

  initDocumentSave(parserId: string) {
    this.loading = true;

    const ext = this.claimants[0].file_name.split('.').pop();
    let apiUrl = `dataParser/documents/company/${this.companyId}/${parserId}`;
    switch (ext) {
      case 'tif':
        apiUrl = `dataParser/documentsExt/company/${this.companyId}/${parserId}`;
        break;
    }

    // console.log(this.claimants.length);
    // console.log(this.claimants);

    this.repository.create(apiUrl, this.claimants).subscribe({
      next: res => {
        if (res.success) {
          this.message = `${res.data} documents saved for processing`;
        } else {
          this.alertService.error(res.message);
        }
        this.refreshPatientsGrid();
        this.loading = false;
      },
      error: _error => {
        //this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  deleteAppointment(document: any, $event: any) {
    $event.stopPropagation();
    const documentId = document.id;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the document ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        const route = `dataParser/${documentId}`;
        this.repository.delete(route).subscribe({
          next: res => {
            if (res.success) {
              this.alertService.info(res.message);
              this.refreshPatientsGrid();
            } else {
              this.alertService.error(res.message);
            }

            this.loading = false;
          },
          error: _error => {
            this.loading = false;
          },
        });
      }
    });
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.initPhysicianDataSource();
        this.initLocationDataSource();
        // this.initRoomDataSource();
        this.initNurseDataSource();
      }
    });
  }

  onApptFieldChanged($event: any) {
    const dataField = $event.dataField;
    if (dataField === 'location' && $event.value) {
      this.initRoomDataSource($event.value);
    }
  }

  onPatientFieldChanged($event: any) {
    const _dataField = $event.dataField;
    // if (dataField === "zipCodeType" && $event.value)
    //     this.patient.zip = "";
  }

  onPatientInsuranceFieldChanged($event: any) {
    const _dataField = $event.dataField;
    // if (dataField === "zipCodeType" && $event.value) {
    //     if (this.isCopyActionExecuting) {
    //         this.isCopyActionExecuting = false;
    //         return;
    //     }
    //     this.insurance.zip = "";
  }

  reloadGrid() {
    this.initProcessedDocsDataSource();
    if (this.patientDataGrid && this.patientDataGrid.instance)
      this.patientDataGrid.instance.refresh();
  }

  public initProcessedDocsDataSource() {
    this.loading = true;
    this.patientDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.docsToProcess),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initPhysicianDataSource(): void {
    this.repository.getData(`user/ddl?empType=1&companyId=${this.companyId}`).subscribe({
      next: res => {
        this.physianDataSource = res.data;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  private initLocationDataSource(): void {
    this.repository.getData(`location/ddl?companyId=${this.companyId}`).subscribe({
      next: res => {
        this.locationDataSource = res.data;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  private initRoomDataSource(locationId: string): void {
    this.repository
      .getData(`room/ddl?companyId=${this.companyId}&locationId=${locationId}`)
      .subscribe({
        next: res => {
          this.roomDataSource = res.data;
        },
        error: error => {
          console.log(error);
          this.loading = false;
        },
      });
  }

  private initNurseDataSource(): void {
    this.repository.getData(`user/ddl?empType=2&companyId=${this.companyId}`).subscribe({
      next: res => {
        this.nurseDataSource = res.data;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }
}
