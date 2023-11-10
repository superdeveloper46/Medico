import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { FamilyHistory } from '../../models/familyHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class FamilyHistoryService {
  public emitFamilyHistorySave: Subject<[FamilyHistory, Array<any>]> = new Subject<[FamilyHistory, Array<any>]>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<FamilyHistory[]>(
        `${this.config.apiUrl}familyhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}familyhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(familyHistory: FamilyHistory, icdCodes: Array<any>) {
    this.emitFamilyHistorySave.next([familyHistory, icdCodes]);

    familyHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      familyHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}familyhistory`, familyHistory)
    );
  }

  delete(familyHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}familyhistory/${familyHistoryId}`)
    );
  }

  getById(familyHistoryId: any) {
    return firstValueFrom(
      this.http.get<FamilyHistory>(
        `${this.config.apiUrl}familyhistory/${familyHistoryId}`
      )
    ).then(familyHistory => {
      if (familyHistory) {
        familyHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          familyHistory.createDate
        );
      }

      return familyHistory;
    });
  }
}
