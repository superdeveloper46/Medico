import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { Patient } from '../patients/models/patient';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { PatientSearchFilter } from '../_models/patientSearchFilter';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  updatePatientNotes(patientId: string, notes: string): Promise<any> {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/id',
      value: patientId,
    });

    patchObject.push({
      op: 'add',
      path: '/notes',
      value: notes,
    });

    return firstValueFrom(
      this.http.patch(`${this.config.apiUrl}${ApiBaseUrls.patient}`, patchObject)
    );
  }

  getPatientNotes(
    id: string,
    fromDate: string,
    toDate: string,
    subject: string,
    status: string,
    employee: string,
    searchContent: string
  ): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(
        `${this.config.apiUrl}${ApiBaseUrls.patientNotes}?` +
          `patientId=${id}&fromDate=${fromDate}&toDate=${toDate}&` +
          `subject=${subject}&status=${status}&employee=${employee}` +
          `&searchContent=${searchContent}`
      )
    ).then(patient => {
      return patient;
    });
  }

  save(patient: Patient): Promise<Patient> {
    patient.dateOfBirth = DateHelper.jsLocalDateToSqlServerUtc(patient.dateOfBirth);
    patient.patientCommunicationMethod =
      patient.patientCommunicationMethodArray.toString();
    return firstValueFrom(
      this.http.post<Patient>(`${this.config.apiUrl}${ApiBaseUrls.patient}/`, patient)
    );
  }

  getById(id: string): Promise<Patient> {
    return firstValueFrom(
      this.http.get<Patient>(`${this.config.apiUrl}${ApiBaseUrls.patient}/${id}`)
    ).then(patient => {
      if (patient) {
        patient.dateOfBirth = DateHelper.sqlServerUtcDateToLocalJsDate(
          patient.dateOfBirth
        );
        patient.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(patient.startDate);
        patient.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(patient.endDate);
        patient.admissionDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          patient.admissionDate
        );
        patient.todaydate = DateHelper.sqlServerUtcDateToLocalJsDate(Date());
        patient.patientCommunicationMethodArray = patient.patientCommunicationMethod
          ? patient.patientCommunicationMethod.split(',').map(Number)
          : [];
      }
      return patient;
    });
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${ApiBaseUrls.patient}/${id}`)
    );
  }

  getByFilter(patientSearchFilter: PatientSearchFilter): Promise<Patient[]> {
    const queryParams = new HttpParams({
      fromObject: patientSearchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<Patient[]>(`${this.config.apiUrl}${ApiBaseUrls.patient}`, {
        params: queryParams,
      })
    );
  }
}
