import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { TobaccoHistory } from '../../models/tobaccoHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class TobaccoHistoryService {
  public emitTobaccoHistorySave: Subject<TobaccoHistory> = new Subject<TobaccoHistory>();

  constructor(private http: HttpClient, private config: ConfigService) {}

  getLastCreated(patientId: string): Promise<TobaccoHistory> {
    return firstValueFrom(
      this.http.get<TobaccoHistory>(
        `${this.config.apiUrl}tobaccohistory/last/patient/${patientId}`
      )
    );
  }

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<TobaccoHistory[]>(
        `${this.config.apiUrl}tobaccohistory/patient/${patientId}`
      )
    );
  }

  save(tobaccoHistory: TobaccoHistory) {
    this.emitTobaccoHistorySave.next(tobaccoHistory);
    // console.log("patient tree: (tobacco.service):");
    // console.log(tobaccoHistory);
    tobaccoHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      tobaccoHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}tobaccohistory`, tobaccoHistory)
    );
  }

  delete(tobaccoHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}tobaccohistory/${tobaccoHistoryId}`)
    );
  }

  getById(tobaccoHistoryId: any) {
    return firstValueFrom(
      this.http.get<TobaccoHistory>(
        `${this.config.apiUrl}tobaccohistory/${tobaccoHistoryId}`
      )
    ).then(tobaccoHistory => {
      if (tobaccoHistory) {
        tobaccoHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          tobaccoHistory.createDate
        );
      }

      return tobaccoHistory;
    });
  }
}
