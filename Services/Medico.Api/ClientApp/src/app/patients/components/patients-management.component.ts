import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { MaskList } from 'src/app/_classes/maskList';
import { StateList } from 'src/app/_classes/stateList';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Patient } from '../models/patient';
import { PatientInsurance } from '../models/patientInsurance';
import { Gender } from 'src/app/_classes/gender';
import { MaritalStatus } from '../classes/maritalStatus';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { PatientService } from '../../_services/patient.service';
import { AlertService } from 'src/app/_services/alert.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { PatientInsuranceService } from '../../_services/patient-insurance.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { ZipCodeType } from '../models/zipCodeType';
import { ZipCodeTypeList } from 'src/app/_classes/zipCodeTypeList';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PatientSearchFilter } from 'src/app/_models/patientSearchFilter';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { Appointment } from 'src/app/_models/appointment';
import { RegexRuleList } from '../../_classes/regexRuleList';
import { PatientIdentificationCodeType } from '../models/enums/patientIdentificationCodeType';
import { RepositoryService } from 'src/app/_services/repository.service';
import { CompanyService } from 'src/app/_services/company.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { Company } from 'src/app/_models/company';
import * as XLSX from 'xlsx';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { PatientCommunicationMethodList } from 'src/app/_classes/patientCommunicationMethodList';

type PatientDataTab = {
  id: number;
  title: string;
  template: string;
};

@Component({
  selector: 'patients-management',
  templateUrl: './patients-management.component.html',
})
export class PatientsManagementComponent implements OnInit, OnDestroy {
  @ViewChild('patientForm', { static: false })
  patientForm!: DxFormComponent;
  @ViewChild('insuranceForm', { static: false })
  insuranceForm!: DxFormComponent;
  @ViewChild('patientDataGrid', { static: false })
  patientDataGrid!: DxDataGridComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;

  canRenderComponent = false;
  selectedAppointmentStatus: string = '';
  patientSearchKeyword: string = '';
  isCopyActionExecuting = false;
  patientCommunicationMethod: any[] = PatientCommunicationMethodList.values;

  public isNewInsurance = true;
  private isNewPatient = true;

  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  validationMasks: MaskList = new MaskList();
  states: any[] = StateList.values;
  gender: any[] = Gender.values;
  maritalStatus: any[] = MaritalStatus.values;
  zipCodeTypes: any[] = ZipCodeTypeList.values;
  patientTab: PatientDataTab = { id: 1, title: 'Patient', template: 'patient' };
  patientInsuranceTab: PatientDataTab = {
    id: 2,
    title: 'Insurance',
    template: 'insurance',
  };
  patientAppointmentsTab: PatientDataTab = {
    id: 3,
    title: 'Appointments',
    template: 'appointments',
  };
  patientNotesTab: PatientDataTab = { id: 4, title: 'Notes', template: 'patientNotes' };
  patientCredentialsTab: PatientDataTab = {
    id: 5,
    title: 'Credentials',
    template: 'patientCredentials',
  };
  patientIdentificationTab: PatientDataTab = {
    id: 6,
    title: 'Identification',
    template: 'patientIdentification',
  };
  patientDataTabs: Array<PatientDataTab> = [];
  patient: Patient;
  insurance: PatientInsurance;
  selectedPatients: Array<any> = [];
  patientDataSource: any = {};
  insuranceCompanies: Array<any> = [];
  isPatientPopupOpened = false;
  regexRuleList: RegexRuleList = new RegexRuleList();
  currentIdentificationFormId?: string;
  identificationCodeTypes = PatientIdentificationCodeType;
  doesAppointmentExist = true;
  insuranceCompanyDataSource: any = {};
  serviceType?: number;
  maxId = 0;
  notes: any[] = [];
  company: Company = new Company();
  fileName = 'patients.xlsx';

  FiveDigitvalues: any[] = [{ name: 'Five Digit', value: 1 }];

  NineDigitvalues: any[] = [{ name: 'Nine Digit', value: 2 }];

  providersDataSource: any = {};
  masDataSource: any = {};
  maxDate:  any = new Date();

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
      // case ZipCodeType.NineDigit:
      default:
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
    private patientService: PatientService,
    private patientInsuranceService: PatientInsuranceService,
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private selectableListService: SelectableListService,
    private appointmentService: AppointmentService,
    private repositoryService: RepositoryService,
    private companyService: CompanyService
  ) {
    this.insurance = new PatientInsurance();
    this.patient = new Patient();
  }

  onDetailedContentChanged(_args: any) {}

  appointmentStatusChanged($event: any) {
    this.selectedAppointmentStatus = $event.value;
    this.refreshPatientsGrid();
  }

  savePatientNotes() {
    if (!this.patient.id) return;

    this.patient.notes = this.notesEditor.content;
    this.patientService
      .updatePatientNotes(this.patient.id, this.patient.notes)
      .then(notes => {
        this.notes = notes;
        this.notesEditor.clearContent();
        this.alertService.info('Patient notes were successfully updated');
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getPatientNotes() {
    if (!this.patient.id) return;

    this.patientService
      .getPatientNotes(this.patient.id, '', '', '', '', '', '')
      .then(notes => {
        this.notes = notes;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onPassword(_patientId?: string) {
    throw 'onPassword is not implemented';
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.patient) this.patient.notes = $event;
  }

  onPatientFieldChanged($event: any) {
    if (this.patient) {
      const dataField = $event.dataField;
      if (dataField === 'zipCodeType' && $event.value) this.patient.zip = '';
    }
  }

  onPatientInsuranceFieldChanged($event: any) {
    const dataField = $event.dataField;
    if (dataField === 'zipCodeType' && $event.value) {
      if (this.isCopyActionExecuting) {
        this.isCopyActionExecuting = false;
        return;
      }

      this.insurance.zip = '';
    }
  }

  deletePatient(patientId: string, $event: any) {
    $event.stopPropagation();

    const currentDate = new Date();

    this.appointmentService
      .getPatientLastVisit(patientId, currentDate)
      .then(lastVisit => {
        const deleteConfirmationMessage =
          this.getPatientDeleteConfirmationMessage(lastVisit);

        if (lastVisit) {
          this.alertService.warning(deleteConfirmationMessage);
          return;
        }

        const confirmationPopup = this.alertService.confirm(
          deleteConfirmationMessage,
          'Confirm deletion'
        );

        confirmationPopup.then(dialogResult => {
          if (dialogResult) {
            this.patientService
              .delete(patientId)
              .then(() => this.refreshPatientsGrid())
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          }
        });
      });
  }

  ngOnInit(): void {
    this.init();
    this.subscribeToCompanyIdChanges();
    this.initProvidersDataSource();
    this.initMasDataSource();
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  createUpdatePatientInsurance($event: any) {
    $event.preventDefault();

    const validationResult = this.insuranceForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }
    this.patientInsuranceService
      .save(this.insurance)
      .then(insurance => {
        this.isNewInsurance = false;

        this.insurance.id = insurance.id;

        this.alertService.info('Patient insurance was saved successfully');
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  createUpdatePatient() {
    const validationResult = this.patientForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    this.checkPatientExistance(this.patient)
      .then(existedPatients => {
        if (existedPatients) {
          this.alertService.warning(
            `The patient <b>${this.patient.firstName} ${this.patient.lastName}</b> already exists. Try to find in the data grid`
          );
          return;
        }

        if (this.isNewPatient) {
          this.patient.companyId = this.companyId;
        }

        this.patientService.save(this.patient).then(patient => {
          this.isNewPatient = false;

          this.patient.id = patient.id;
          this.patient.password = patient.password;

          if (this.isNewInsurance && this.patientDataTabs.length == 1) {
            this.patientDataTabs.push(this.patientInsuranceTab);

            this.patientDataTabs.push(this.patientAppointmentsTab);

            this.patientDataTabs.push(this.patientNotesTab);

            this.patientDataTabs.push(this.patientCredentialsTab);
            // this.patientDataTabs
            //     .push(this.patientIdentificationTab);
          }

          this.alertService.info('Patient data was saved successfully');

          this.refreshPatientsGrid();
          this.getMaxId();
        });
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  openPatientForm() {
    this.patientDataTabs.push(this.patientTab);
    this.isPatientPopupOpened = true;
    if (this.company.zipCodeType == 1) {
      this.patient.zipCodeType = 1;
      this.zipCodeTypes = this.FiveDigitvalues;
    } else {
      this.patient.zipCodeType = 2;
      this.zipCodeTypes = this.NineDigitvalues;
    }
  }

  closePatientForm() {
    this.isPatientPopupOpened = false;
  }

  getFullNameDisplayExpression(item: any) {
    if (!item) return '';
    return `${item.FirstName} ${item.LastName}`;
  }

  onPatientPopupHidden() {
    this.patient = new Patient();
    this.insurance = new PatientInsurance();

    this.selectedPatients = [];
    this.patientDataTabs = [];

    this.isNewPatient = true;
    this.isNewInsurance = true;
  }

  refreshPatientsGrid() {
    this.patientDataGrid.instance.refresh();
  }

  onPatientSelected($event: any) {
    const patientId = $event.data.id;

    const patientPromise = this.patientService.getById(patientId);
    const patientInsurancePromise =
      this.patientInsuranceService.getByPatientId(patientId);

    Promise.all([patientPromise, patientInsurancePromise])
      .then(result => {
        const patient = result[0];
        const insurance = result[1];

        this.patient = patient;
        this.isNewPatient = false;

        if (insurance) {
          this.insurance = insurance;
          this.insurance.fin = this.patient.fin;
          this.insurance.mrn = this.patient.mrn;
          // if (insurance.mrn === '') {
          //     this.autoMRN();
          // }
          // if (insurance.fin === '') {
          //     this.autoFIN();
          // }

          this.isNewInsurance = false;
        } else {
          this.autoMRN();
          this.autoFIN();
        }

        // get patient notes history
        this.getPatientNotes();

        this.patientDataTabs.push(this.patientTab);
        this.patientDataTabs.push(this.patientInsuranceTab);
        this.patientDataTabs.push(this.patientAppointmentsTab);
        this.patientDataTabs.push(this.patientNotesTab);
        this.patientDataTabs.push(this.patientCredentialsTab);
        // this.patientDataTabs.push(this.patientIdentificationTab);

        this.isPatientPopupOpened = true;
        if (this.company.zipCodeType == 1) {
          this.patient.zipCodeType = 1;
          this.insurance.zipCodeType = 1;
          this.zipCodeTypes = this.FiveDigitvalues;
        } else {
          this.patient.zipCodeType = 2;
          this.insurance.zipCodeType = 2;
          this.zipCodeTypes = this.NineDigitvalues;
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  copyFromPatient() {
    this.isCopyActionExecuting = true;

    const patientFieldsToExclude = [
      'maritalStatus',
      'companyId',
      'id',
      'patientInsuranceId',
    ];

    const patient = this.patient;
    const insurance = this.insurance;

    if (!patient || !insurance) {
      return;
    }

    for (const fieldName in patient) {
      if (
        patientFieldsToExclude.indexOf(fieldName) !== -1 ||
        !Object.prototype.hasOwnProperty.call(patient, fieldName)
      ) {
        continue;
      }

      (<any>insurance)[fieldName] = (<any>patient)[fieldName];
    }

    insurance.patientId = patient.id;
  }

  private getPatientDeleteConfirmationMessage(appointment: Appointment): string {
    if (!appointment) return 'Are you sure you want to delete the patient ?';

    const appointmentDate = DateHelper.getDate(appointment.startDate);

    return `Unable to perform delete operation.
                The patient already has at least one appointment scheduled on ${appointmentDate}.`;
  }

  private init(): any {
    this.initPatientDataStore();
    this.initInsuranceCompanyDataSource();
  }

  private initPatientDataStore(): any {
    this.patientDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.patient),

      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
          jQueryAjaxSettings.data.appointmentStatus = this.selectedAppointmentStatus;
          jQueryAjaxSettings.data.searchKeyword = this.patientSearchKeyword;
        },
        this
      ),
    });
  }

  private getMaxId(): void {
    this.repositoryService.getData(`patientinsurance/maxMrn`).subscribe({
      next: res => {
        if (this.insurance) {
          this.maxId = res as any;
          const mrn = this.company.name
            .split(/\s/)
            .reduce((response, word) => (response += word.slice(0, 1)), '');
          this.insurance.mrn = `MRN-${mrn}-${this.maxId + 10000}`;
          this.insurance.fin = `FIN${this.maxId + 10000}`;
        }
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  private autoMRN(): void {
    this.repositoryService.getData(`patientinsurance/maxMrn`).subscribe({
      next: res => {
        if (this.insurance) {
          this.maxId = res as any;
          const mrn = this.company.name
            .split(/\s/)
            .reduce((response, word) => (response += word.slice(0, 1)), '');
          this.insurance.mrn = `MRN-${mrn}-${this.maxId + 10000}`;
        }
      },
      error: error => {
        console.log(error);
      },
    });
  }

  private autoFIN(): void {
    this.repositoryService.getData(`patientinsurance/maxMrn`).subscribe({
      next: (res: any) => {
        if (this.insurance) {
          this.maxId = res;
          this.insurance.fin = `FIN${this.maxId + 10000}`;
        }
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;

        this.companyService
          .getById(this.companyId)
          .then(company => {
            this.company = company;
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
        this.setCompanyType(companyId);
        this.initSelectableLists();

        if (this.patientDataGrid && this.patientDataGrid.instance)
          this.patientDataGrid.instance.refresh();
      }
    });
  }

  private setCompanyType(companyId: string) {
    this.companyService
      .getById(companyId)
      .then(company => {
        this.serviceType = company.serviceType;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private checkPatientExistance(patient: Patient): Promise<Patient[] | undefined> {
    const isNewPatient = !patient.id;
    if (!isNewPatient) return Promise.resolve([]);

    const patientSearchFilter = new PatientSearchFilter();

    patientSearchFilter.companyId = this.companyId;
    patientSearchFilter.firstName = patient.firstName;
    patientSearchFilter.lastName = patient.lastName;
    patientSearchFilter.ssn = patient.ssn;

    patientSearchFilter.dateOfBirth = DateHelper.jsLocalDateToSqlServerUtc(
      patient.dateOfBirth
    );

    return this.patientService.getByFilter(patientSearchFilter).then(patients => {
      return patients.length ? patients : undefined;
    });
  }

  private initSelectableLists() {
    const patientSuffixConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.patientSuffix,
      LibrarySelectableListIds.application.patientSuffix
    );

    const appointmentStatusConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.appointmentStatus,
      LibrarySelectableListIds.application.appointmentStatus
    );

    const selectableLists = [patientSuffixConfig, appointmentStatusConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initInsuranceCompanyDataSource(): void {
    this.repositoryService.getData(`insurance/company/dx/lookup`).subscribe({
      next: res => {
        this.insuranceCompanies = res.data;
      },
      error: error => {
        console.log(error);
      },
    });
  }

  onInsuranceCompanyChanged(_$event: any) {}

  export(): void {
    const patientSearchFilter = new PatientSearchFilter();

    patientSearchFilter.companyId = this.companyId;
    patientSearchFilter.firstName = '';
    patientSearchFilter.lastName = '';
    patientSearchFilter.ssn = '';
    patientSearchFilter.take = 10000;

    this.patientService.getByFilter(patientSearchFilter).then(patients => {
      this.doExport(patients);
    });
  }

  private doExport(data: any) {
    const rowsData = this.patientDataGrid.instance.getSelectedRowsData();
    const ids = rowsData.map(item => item.id).toString();
    const array: any[] = [];
    const obj: any[] = data;

    obj.forEach(element => {
      if (ids.indexOf(element.id) !== -1) {
        array.push({
          'Name Suffix': element.nameSuffix,
          FirstName: element.firstName,
          'Middle Name': element.middleName,
          'Last Name': element.lastName,
          'Admission Date': element.admissionDate,
          'Case Number': element.caseNumber,
          RQID: element.rqid,
          City: element.city,
          'Date of Birth': element.dateOfBirth,
          Email: element.email,
          FIN: element.fin,
          MRN: element.mrn,
          'Primary Address': element.primaryAddress,
          'Primary Phone': element.primaryPhone,
          'Secondary Address': element.secondaryAddress,
          'Secondary Phone': element.secondaryPhone,
          Zip: element.zip,
          Notes: element.notes,
        });
      }
    });

    if (array.length === 0) {
      this.alertService.error('Select employees to export.');
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(array);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);
  }

  keywordChanged(data: any) {
    this.patientSearchKeyword = data.value;
    this.refreshPatientsGrid();
  }

  private initProvidersDataSource(): void {
    this.providersDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.patient.companyId;
        },
        this
      ),
    });
  }

  private initMasDataSource(): void {
    this.masDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[1].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.patient.companyId;
        },
        this
      ),
    });
  }
}
