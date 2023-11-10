import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { PatientInsurance } from '../patients/models/patientInsurance';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientInsuranceService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  save(patientInsurance: PatientInsurance): Promise<PatientInsurance> {
    patientInsurance.dateOfBirth = DateHelper.jsLocalDateToSqlServerUtc(
      patientInsurance.dateOfBirth
    );
    return firstValueFrom(
      this.http.post<PatientInsurance>(
        `${this.config.apiUrl}patientinsurance/`,
        patientInsurance
      )
    );
  }

  getByPatientId(patientid: string): Promise<PatientInsurance> {
    return firstValueFrom(
      this.http.get<PatientInsurance>(
        `${this.config.apiUrl}patientinsurance/patient/${patientid}`
      )
    ).then(patientInsurance => {
      if (patientInsurance)
        patientInsurance.dateOfBirth = DateHelper.sqlServerUtcDateToLocalJsDate(
          patientInsurance.dateOfBirth
        );

      return patientInsurance;
    });
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}patientInsurance/${id}`)
    );
  }
}
