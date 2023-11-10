import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { Patient } from 'src/app/patients/models/patient';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { Gender } from 'src/app/_classes/gender';
import { MaskList } from 'src/app/_classes/maskList';
import { PatientCommunicationMethodList } from 'src/app/_classes/patientCommunicationMethodList';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { StateList } from 'src/app/_classes/stateList';
import { ZipCodeTypeList } from 'src/app/_classes/zipCodeTypeList';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { PatientSearchFilter } from 'src/app/_models/patientSearchFilter';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { CompanyService } from 'src/app/_services/company.service';
import { PatientService } from 'src/app/_services/patient.service';
import { PatientChartHeaderData } from '../../models/patientChartHeaderData';
import { Appointment } from 'src/app/_models/appointment';
import { LocationService } from 'src/app/administration/services/location.service';
import { UserService } from 'src/app/administration/services/user.service';
import { PatientInsuranceService } from 'src/app/_services/patient-insurance.service';
import { PatientInsurance } from 'src/app/patients/models/patientInsurance';

@Component({
  selector: 'patient-info',
  templateUrl: './patient-info.component.html',
  styleUrls: ['./patient-info.component.sass'],
})
export class PatientInfoComponent implements OnInit {
  @ViewChild('patientForm', { static: false })
  patientForm!: DxFormComponent;

  @Input() patientId: any;
  @Input() companyId: any;
  @Input() appointment?: Appointment;
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();

  gender: any[] = Gender.values;
  zipCodeTypes: any[] = ZipCodeTypeList.values;
  patientCommunicationMethod: any[] = PatientCommunicationMethodList.values;
  states: any[] = StateList.values;
  patient: Patient = new Patient();
  patientInsurance: PatientInsurance = new PatientInsurance();
  validationMasks: MaskList = new MaskList();
  regexRuleList: RegexRuleList = new RegexRuleList();
  serviceType?: number;
  companyIdSubscription?: Subscription;
  patientChartHeaderData?: PatientChartHeaderData;

  providerName: string = '';
  locationName: string = '';

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

  constructor(
    private companyIdService: CompanyIdService,
    private patientService: PatientService,
    private alertService: AlertService,
    private companyService: CompanyService,
    private locationService: LocationService,
    private userService: UserService,
    private patientInsuranceService: PatientInsuranceService,
  ) {}

  ngOnInit() {
    this.setCompanyType(this.companyId);
    this.bindPatient();
    this.bindPatientInsurance();

    if(this.appointment != null) {
      if(this.appointment.locationId != null) {
        this.locationService
        .getById(this.appointment.locationId)
        .then(location => {
          if(location.name) {
            this.locationName = location.name;
          }
          
        })
        .catch(error => {
          
        });
      }

      // if(this.appointment.physicianId != null) {
      //   this.userService
      //   .getById(this.appointment.physicianId)
      //   .then(user => {
      //     this.providerName = user.firstName + ' ' + user.lastName;
      //   })
      //   .catch(error => {
      //   });
      // }
    }
  }

  onPatientFieldChanged($event: any) {
    const _dataField = $event.dataField;
    // if (dataField === "zipCodeType" && $event.value)
    //   this.patient.zip = "";
  }

  private checkPatientExistance(patient: Patient): Promise<Patient[] | null> {
    const isNewPatient = !patient.id;
    if (!isNewPatient) return Promise.resolve(null);

    const patientSearchFilter = new PatientSearchFilter();

    patientSearchFilter.companyId = this.companyId;
    patientSearchFilter.firstName = patient.firstName;
    patientSearchFilter.lastName = patient.lastName;
    patientSearchFilter.ssn = patient.ssn;

    patientSearchFilter.dateOfBirth = DateHelper.jsLocalDateToSqlServerUtc(
      patient.dateOfBirth
    );

    return this.patientService.getByFilter(patientSearchFilter).then(patients => {
      return patients.length ? patients : null;
    });
  }

  updatePatient() {
    
    const validationResult = this.patientForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }
    console.log(this.patient.email)

    this.checkPatientExistance(this.patient)
      .then(existedPatients => {
        if (existedPatients) {
          this.alertService.warning(
            `The patient <b>${this.patient.firstName} ${this.patient.lastName}</b> already exists. Try to find in the data grid`
          );
          return;
        }
        this.patient.patientCommunicationMethod =
          this.patient.patientCommunicationMethodArray.toString();
        this.patientService.save(this.patient).then(_patient => {
          this.alertService.info('Patient data was updated successfully');
          this.notifyParent.emit(this.patient);
          window.location.reload();
        });
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
   
  }

  bindPatient() {
    const patientPromise = this.patientService.getById(this.patientId);

    Promise.all([patientPromise])
      .then(result => {
        const patient = result[0];
        this.patient = patient;

        this.patient.patientCommunicationMethodArray = [1];
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  bindPatientInsurance() {
    const patientInsurancePromise = this.patientInsuranceService.getByPatientId(this.patientId);

    Promise.all([patientInsurancePromise])
      .then(result => {
        const patientInsurance = result[0];
        this.patientInsurance = patientInsurance;

        if(this.patientInsurance.providerId) {
          this.userService
          .getById(this.patientInsurance.providerId)
          .then(user => {
            this.providerName = user.firstName + ' ' + user.lastName;
          })
          .catch(error => {
          });
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private setCompanyType(companyId: string) {
    this.companyService
      .getById(companyId)
      .then(company => {
        this.serviceType = company.serviceType;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }
}
