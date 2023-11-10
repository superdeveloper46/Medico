import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { MedicalHistory } from '../../models/medicalHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class MedicalHistoryService {
  public emitMedicalHistorySave: Subject<[MedicalHistory, Array<any>]> = new Subject<[MedicalHistory, Array<any>]>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<MedicalHistory[]>(
        `${this.config.apiUrl}medicalhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}medicalhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(medicalHistory: MedicalHistory, icdCodes: Array<any>) {
    this.emitMedicalHistorySave.next([medicalHistory, icdCodes]);

    medicalHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      medicalHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}medicalhistory`, medicalHistory)
    );
  }

  delete(medicalHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}medicalhistory/${medicalHistoryId}`)
    );
  }

  getById(medicalHistoryId: any) {
    return firstValueFrom(
      this.http.get<MedicalHistory>(
        `${this.config.apiUrl}medicalhistory/${medicalHistoryId}`
      )
    ).then(medicalHistory => {
      if (medicalHistory) {
        medicalHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          medicalHistory.createDate
        );
      }

      return medicalHistory;
    });
  }
}
