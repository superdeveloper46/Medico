import { PatientService } from 'src/app/_services/patient.service';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { PatientInsuranceService } from 'src/app/_services/patient-insurance.service';
import { CompanyService } from 'src/app/_services/company.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import * as moment from 'moment';
import { StateList } from 'src/app/_classes/stateList';
import { Patient } from 'src/app/patients/models/patient';
import { Company } from 'src/app/_models/company';
import { AppointmentGridItem } from 'src/app/scheduler/models/appointmentGridItem';
import { Inject, Injectable } from '@angular/core';
import { Admission } from '../models/admission';
import { ConfigService } from 'src/app/_services/config.service';
import { PatientInsurance } from 'src/app/patients/models/patientInsurance';
import { DOCUMENT } from '@angular/common';
import { HtmlReportHelperService } from './html-report-helper.service';

@Injectable()
export class PatientChartReportHeaderService {
  constructor(
    private patientService: PatientService,
    private patientInsuranceService: PatientInsuranceService,
    private companyService: CompanyService,
    private appointmentService: AppointmentService,
    private configService: ConfigService,
    @Inject(DOCUMENT) private document: Document,
    private htmlReportHelperService: HtmlReportHelperService
  ) {}

  getPatientChartNodeReportContent(
    admission: Admission,
    companyId: string,
    isOutsideRichTextEditor = false
  ): Promise<string> {
    const { patientId, appointmentId } = admission;

    const patientPromise = this.patientService.getById(patientId);
    const patientInsurancePromise =
      this.patientInsuranceService.getByPatientId(patientId);

    const companyPromise = this.companyService.getById(companyId);

    const appointmentGridViewPromise =
      this.appointmentService.getAppointmentGridItemById(appointmentId);

    const promises: [
      Promise<Patient>,
      Promise<any>,
      Promise<Company>,
      Promise<AppointmentGridItem>
    ] = [
      patientPromise,
      patientInsurancePromise,
      companyPromise,
      appointmentGridViewPromise,
    ];

    return Promise.all(promises).then(result => {
      const [patient, patientInsurance, company, appointmentGridView] = result;

      const companyState = StateList.values.filter(s => s.value === company.state)[0]
        .name;

      const appointmentInfoTable = this.createAppointmentInfoTable(
        patient,
        patientInsurance,
        appointmentGridView,
        company
      );

      let logoUrl;
      if (isOutsideRichTextEditor) {
        logoUrl = './patient-chart/imgs/logo.jpg';
      } else if (this.configService.baseUrl) {
        logoUrl = `${this.configService.baseUrl}patient-chart/imgs/logo.jpg`;
      } else {
        `${this.document.location.protocol}//${document.location.hostname}/patient-chart/imgs/logo.jpg`;
      }

      return `
                    <div>
                        <div style="overflow:hidden">
                            <div style="float:right;width:33.3%;text-align:right;">
                                <img src="${logoUrl}">
                            </div>
                        </div>
                        <div style="margin-top:0.5em;">
                            <div style="line-height:1.1em;color:grey;font-size:0.8em;font-weight:bold;float:right;width:33.3%;text-align:right;">
                            <div style="margin-top:0.5em;">${company.address} - ${company.secondaryAddress}</div>
                            <div style="margin-top:0.5em;">${company.city} - ${companyState} - 85012</div>
                            <div style="margin-top:0.5em;">Office ${company.phone}</span>
                            <div style="margin-top:0.5em;">Fax ${company.fax} - 866 264 4120</div>
                        </div>
                    </div>
                    <h2 style="color:grey;clear:both;">History and Physical</h2>
                    <hr/>
                    <div>${appointmentInfoTable}</div>`;
    });
  }

  private createAppointmentInfoTable(
    patient: Patient,
    patientInsurance: PatientInsurance,
    appointmentGridView: AppointmentGridItem,
    company: Company
  ): string {
    const emptyValue = '---';

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const patientDoB = moment(patient.dateOfBirth).format('LL');
    const patientAge = DateHelper.getAge(patient.dateOfBirth);

    let rqId: string | undefined = '';
    let caseNumber = '';
    if (patientInsurance != null) {
      rqId = patientInsurance.mrn || patientInsurance.rqid;

      caseNumber =
        patientInsurance && patientInsurance.caseNumber
          ? patientInsurance.caseNumber
          : emptyValue;
    }

    const ssn = patient.ssn ? patient.ssn : emptyValue;
    rqId = rqId || emptyValue;

    const appointmentDate = moment(appointmentGridView.startDate).format('LL');

    return this.htmlReportHelperService.createReportTable([
      [
        '<strong>Name:</strong>',
        patientName,
        '<strong>Date of Exam:</strong>',
        appointmentDate,
      ],
      [
        '<strong>Date Of Birth / Age:</strong>',
        `${patientDoB} / ${patientAge}`,
        `<strong>${company.serviceType === 2 ? 'MRN' : 'RQID'}:</strong>`,
        rqId,
      ],
      [
        '<strong>Case Number:</strong>',
        caseNumber,
        '<strong>Consultative Examiner:</strong>',
        `${appointmentGridView.physicianFirstName} ${appointmentGridView.physicianLastName} (${appointmentGridView.patientNameSuffix})`,
      ],
      [
        '<strong>Social Security</strong>:',
        ssn,
        '<strong>Location of Exam:</strong>',
        `${appointmentGridView.locationName}`,
      ],
    ]);
  }
}
