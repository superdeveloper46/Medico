import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { DrugHistory } from '../../models/drugHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class DrugHistoryService {
  public emitDrugHistorySave: Subject<DrugHistory> = new Subject<DrugHistory>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<DrugHistory[]>(
        `${this.config.apiUrl}drughistory/patient/${patientId}`
      )
    );
  }

  getLastCreated(patientId: string): Promise<DrugHistory> {
    return firstValueFrom(
      this.http.get<DrugHistory>(
        `${this.config.apiUrl}drughistory/last/patient/${patientId}`
      )
    );
  }

  save(drugHistory: DrugHistory) {
    this.emitDrugHistorySave.next(drugHistory);

    drugHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(drugHistory.createDate);

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}drughistory`, drugHistory)
    );
  }

  delete(drugHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}drughistory/${drugHistoryId}`)
    );
  }

  getById(drugHistoryId: any) {
    return firstValueFrom(
      this.http.get<DrugHistory>(`${this.config.apiUrl}drughistory/${drugHistoryId}`)
    ).then(drugHistory => {
      if (drugHistory) {
        drugHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          drugHistory.createDate
        );
      }

      return drugHistory;
    });
  }
}
