import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PatientChartHeaderData } from '../../models/patientChartHeaderData';
import { PatientService } from 'src/app/_services/patient.service';
import { BaseVitalSignsService } from '../../patient-chart-tree/services/base-vital-signs.service';
import { AllergyService } from '../../patient-chart-tree/services/allergy.service';
import { VitalSignsService } from '../../patient-chart-tree/services/vital-signs.service';
import { Allergy } from '../../models/allergy';
import { BaseVitalSigns } from '../../models/baseVitalSigns';
import { MedicalCalculationHelper } from 'src/app/_helpers/medical-calculation.helper';
import { VitalSigns } from '../../models/vitalSigns';
import { Patient } from 'src/app/patients/models/patient';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { Constants } from 'src/app/_classes/constants';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { RepositoryService } from 'src/app/_services/repository.service';
import { Appointment } from 'src/app/_models/appointment';

@Component({
  templateUrl: 'patient-chart-header.component.html',
  selector: 'patient-chart-header',
  styleUrls: ['patient-chart-header.component.sass'],
})
export class PatientChartHeaderComponent {
  patient: Patient = new Patient();

  @Input() appointment?: Appointment;
  @Input()
  set patientChartHeaderData(patientChartHeaderData: PatientChartHeaderData | undefined) {
    if (!patientChartHeaderData) {
      return;
    }
    this.refreshPatientHeader(patientChartHeaderData);
  }

  @Output() outPatientInfo: EventEmitter<any> = new EventEmitter<any>();

  isPatientChartHeaderReady = false;

  allergiesDefaultValue: string = '';

  isPatientAllergiesPopoverVisible = false;
  isPatientInfoPopoverVisible = false;
  patientName: string = '';
  patientMrn: string = Constants.messages.notSet;
  patientDateOfBirth: any = null;

  patientAllergies: string[] = [];

  get isPatientHaveAllergies(): boolean {
    return !!this.patientAllergies.length;
  }

  patientVitalSigns: any = {
    height: Constants.messages.notSet,
    weight: Constants.messages.notSet,
    bmi: Constants.messages.notSet,
    pulse: Constants.messages.notSet,
    bloodPressure: {
      systolic: 0,
      diastolic: 0,
    },
    resp: 0,
    o2Sat: 0,
  };

  dateOfService: any;
  currentDate: any = new Date();
  patientEmail = '';
  lookUpData: any[] = [];
  bmiAbnormal = false;
  pulseAbnormal = false;
  systolicAbnormal = false;
  respAbnormal = false;
  o2Abnormal = false;

  vitalSignsFromExpression: any;

  constructor(
    private repositoryService: RepositoryService,
    private patientService: PatientService,
    private baseVitalSignsService: BaseVitalSignsService,
    private allergyService: AllergyService,
    private vitalSignsService: VitalSignsService,
    private defaultValueService: DefaultValueService
  ) {
    this.initAllergiesDefaultValue();
  }

  togglePatientAllergiesPopover() {
    this.isPatientAllergiesPopoverVisible = !this.isPatientAllergiesPopoverVisible;
  }

  togglePatientInfoPopover() {
    this.isPatientInfoPopoverVisible = !this.isPatientInfoPopoverVisible;
  }

  refreshPatientHeader(patientChartHeaderData: PatientChartHeaderData): void {
    this.isPatientChartHeaderReady = false;

    this.dateOfService = patientChartHeaderData.dateOfService;
    const patientId = patientChartHeaderData.patientId;

    const patientPromise = this.patientService.getById(patientId);

    const patientBaseVitalSignsPromise =
      this.baseVitalSignsService.getByPatientId(patientId);

    const patientVitalSignsByAdmissionPromise =
      this.vitalSignsService.getByPatientAndAdmissionIds(
        patientId,
        patientChartHeaderData.admissionId
      );

    const patientVitalSignsFromExpressionByAdmissionPromise =
      this.vitalSignsService.getFromExpression(
        patientId,
        patientChartHeaderData.admissionId
      );

    this.currentDate = new Date();

    const patientAllergiesPromise = this.allergyService.getByPatientIdAndDate(
      patientId,
      this.currentDate
    );

    Promise.all([
      patientPromise,
      patientBaseVitalSignsPromise,
      patientAllergiesPromise,
      patientVitalSignsByAdmissionPromise,
      patientVitalSignsFromExpressionByAdmissionPromise,
    ]).then(result => {
      const patient = result[0];
      this.patient = patient;

      this.setPatientPersonalInfo(patient);

      const patientBaseVitalSigns = result[1];

      if (patientBaseVitalSigns) {
        this.setPatientBaseVitalSigns(patientBaseVitalSigns);
      }

      const patientAllergies = result[2];
      this.setPatientAllergies(patientAllergies);

      const patientVitalSigns = result[3];
      this.setPatientVitalSigns(patientVitalSigns);

      this.vitalSignsFromExpression = result[4];
      console.log('this.vitalSignsFromExpression:', this.vitalSignsFromExpression);
      this.isPatientChartHeaderReady = true;
    });
  }

  private initAllergiesDefaultValue(): void {
    this.defaultValueService
      .getByPatientChartNodeType(PatientChartNodeType.AllergiesNode)
      .then(defaultValue => {
        this.allergiesDefaultValue = defaultValue.value ? defaultValue.value : '';
      });
  }

  private setPatientAllergies(patientAllergies: Allergy[]): any {
    if (!patientAllergies || !patientAllergies.length) {
      this.resetPatientAllergies();
      return;
    }

    this.patientAllergies = patientAllergies.map(a => a.medication);
  }

  private resetPatientAllergies() {
    this.patientAllergies = [];
  }

  private setPatientBaseVitalSigns(patientVitalSigns: BaseVitalSigns): void {
    const patientHeight = patientVitalSigns.height;
    const patientWeight = patientVitalSigns.weight;

    if (patientHeight) {
      this.patientVitalSigns.height = patientHeight;
    }

    if (patientWeight) {
      this.patientVitalSigns.weight = patientWeight;
    }

    if (patientWeight && patientHeight) {
      this.patientVitalSigns.bmi = MedicalCalculationHelper.calculateBmi(
        patientHeight,
        patientWeight
      );
    }
  }

  private setPatientVitalSigns(patientVitalSignsByAdmission: VitalSigns[]): void {
    if (!patientVitalSignsByAdmission || !patientVitalSignsByAdmission.length) {
      return;
    }

    let isSystolicBloodPressureSet,
      isDiastolicBloodPressureSet,
      isRespirationRateSet,
      isTemperatureSet,
      isUnitSet,
      isO2SatSet,
      isPulseSet = false;

    for (let i = 0; i < patientVitalSignsByAdmission.length; i++) {
      const vitalSigns = patientVitalSignsByAdmission[i];

      if (!isSystolicBloodPressureSet && vitalSigns.systolicBloodPressure) {
        this.patientVitalSigns.bloodPressure.systolic = vitalSigns.systolicBloodPressure;
        isSystolicBloodPressureSet = true;
      }

      if (!isDiastolicBloodPressureSet && vitalSigns.diastolicBloodPressure) {
        this.patientVitalSigns.bloodPressure.diastolic =
          vitalSigns.diastolicBloodPressure;
        isDiastolicBloodPressureSet = true;
      }

      if (!isRespirationRateSet && vitalSigns.respirationRate) {
        this.patientVitalSigns.resp = vitalSigns.respirationRate;
        isRespirationRateSet = true;
      }
      if (!isTemperatureSet && vitalSigns.temperature) {
        this.patientVitalSigns.resp = vitalSigns.temperature;
        isTemperatureSet = true;
      }
      if (!isUnitSet && vitalSigns.unit) {
        this.patientVitalSigns.resp = vitalSigns.unit;
        isUnitSet = true;
      }

      if (!isO2SatSet && vitalSigns.oxygenSaturationAtRestValue) {
        this.patientVitalSigns.o2Sat = vitalSigns.oxygenSaturationAtRestValue;
        isO2SatSet = true;
      }

      if (!isPulseSet && vitalSigns.pulse) {
        this.patientVitalSigns.pulse = vitalSigns.pulse;
        isPulseSet = true;
      }
    }
  }

  private setPatientPersonalInfo(patient: Patient): void {
    this.bindVitalSigns(patient.companyId);

    this.patientName = `${patient.firstName} ${patient.lastName}`;
    this.patientDateOfBirth = patient.dateOfBirth;
    this.patientEmail = patient.email;

    this.outPatientInfo.emit(patient);
  }

  patientUpdated(_$event: any) {}

  private bindVitalSigns(_companyId: any) {
    const apiUrl = `vitalsigns-lookup/dx/grid?skip=0&take=10&requireTotalCount=true&_=1629197124746`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: (res: any) => {
        if (res) {
          this.lookUpData = res.data;

          this.validateBmi();
          this.validatePulseRate();
          this.validateBP();
          this.validateResp();
          this.validateO2();
        }
      },
      error: _error => {},
    });
  }

  private validatePulseRate() {
    const pulseRange = this.lookUpData.filter(c => c.title.trim() === 'Pulse Rate')[0];
    if (pulseRange) {
      const minValue = pulseRange.minValue;
      const maxValue = pulseRange.maxValue;

      const pulse = parseFloat(this.patientVitalSigns.pulse);
      if (pulse < minValue || pulse > maxValue) {
        this.pulseAbnormal = true;
      }
    }
  }

  private validateBmi() {
    if (this.patientVitalSigns.bmi === 'not set') return;
    const bmi = parseFloat(this.patientVitalSigns.bmi);

    const bmiRange = this.lookUpData.filter(c => c.title.trim() === 'BMI Underweight')[0];
    if (bmiRange) {
      const minValue = bmiRange.minValue;
      const maxValue = bmiRange.maxValue;

      if (bmi < minValue || bmi > maxValue) {
        this.bmiAbnormal = true;
      }
    }
  }

  private validateResp() {
    const resp = parseFloat(this.patientVitalSigns.resp);
    if (resp === 0) return;

    const respRange = this.lookUpData.filter(c => c.title.trim() === 'Resp Rate')[0];
    if (respRange) {
      const minValue = respRange.minValue;
      const maxValue = respRange.maxValue;

      if (resp < minValue || resp > maxValue) {
        this.respAbnormal = true;
      }
    }
  }

  private validateO2() {
    const resp = parseFloat(this.patientVitalSigns.o2Sat);
    if (resp === 0) return;

    const o2 = this.lookUpData.filter(c => c.title.trim() === 'O2 Sat')[0];
    if (o2) {
      const minValue = o2.minValue;
      const maxValue = o2.maxValue;

      if (resp < minValue || resp > maxValue) {
        this.o2Abnormal = true;
      }
    }
  }

  private validateBP() {
    const systolic = parseFloat(this.patientVitalSigns.bloodPressure.systolic);
    if (systolic === 0) return;

    const bpRange = this.lookUpData.filter(c => c.title.trim() === 'Systolic BP')[0];
    if (bpRange) {
      const minValue = bpRange.minValue;
      const maxValue = bpRange.maxValue;

      if (systolic < minValue || systolic > maxValue) {
        this.systolicAbnormal = true;
      }
    }
  }

  public vitalSignsColor(key: string) {
    if (this.vitalSignsFromExpression.hasOwnProperty(key)) {
      if (this.vitalSignsFromExpression[key].hasOwnProperty('warningLevel')) {
        return {
          red_bg: this.vitalSignsFromExpression[key]['warningLevel'] === 'red',
          green_bg: this.vitalSignsFromExpression[key]['warningLevel'] === 'green',
          orange_bg: this.vitalSignsFromExpression[key]['warningLevel'] === 'orange',
          'bg-secondary': this.vitalSignsFromExpression[key]['warningLevel'] === '',
        };
      }
    }

    return {
      'bg-secondary': true,
    };
  }

  private vitalSignsMessage(key: string) {
    if (this.vitalSignsFromExpression.hasOwnProperty(key)) {
      if (this.vitalSignsFromExpression[key].hasOwnProperty('Message')) {
        return this.vitalSignsFromExpression[key]['Message'];
      }
    }

    return '';
  }

  private vitalSignsValue(key: string) {
    if (this.vitalSignsFromExpression.hasOwnProperty('Patient')) {
      if (this.vitalSignsFromExpression['Patient'].hasOwnProperty(key)) {
        if (
          this.vitalSignsFromExpression['Patient'][key] != -1 &&
          this.vitalSignsFromExpression['Patient'][key] != null
        ) {
          return (
            this.vitalSignsFromExpression['Patient'][key].toFixed(2) +
            this.vitalSignsUnits(key)
          );
        }
      }
    }

    return 'not set';
  }

  private vitalSignsUnits(key: string) {
    if (this.vitalSignsFromExpression.hasOwnProperty(key)) {
      if (this.vitalSignsFromExpression[key].hasOwnProperty('valUnits')) {
        return this.vitalSignsFromExpression[key]['valUnits'];
      }
    }

    return '';
  }
}
