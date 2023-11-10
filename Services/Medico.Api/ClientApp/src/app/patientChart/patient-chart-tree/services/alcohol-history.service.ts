import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { AlcoholHistory } from '../../models/alcoholHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class AlcoholHistoryService {
  public emitAlcoholHistorySave: Subject<AlcoholHistory> = new Subject<AlcoholHistory>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<AlcoholHistory[]>(
        `${this.config.apiUrl}alcoholhistory/patient/${patientId}`
      )
    );
  }

  getLastCreated(patientId: string): Promise<AlcoholHistory> {
    return firstValueFrom(
      this.http.get<AlcoholHistory>(
        `${this.config.apiUrl}alcoholhistory/last/patient/${patientId}`
      )
    );
  }

  save(alcoholHistory: AlcoholHistory) {
    this.emitAlcoholHistorySave.next(alcoholHistory);

    alcoholHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      alcoholHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}alcoholhistory`, alcoholHistory)
    );
  }

  delete(alcoholHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}alcoholhistory/${alcoholHistoryId}`)
    );
  }

  getById(alcoholHistoryId: any) {
    return firstValueFrom(
      this.http.get<AlcoholHistory>(
        `${this.config.apiUrl}alcoholhistory/${alcoholHistoryId}`
      )
    ).then(alcoholHistory => {
      if (alcoholHistory) {
        alcoholHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          alcoholHistory.createDate
        );
      }

      return alcoholHistory;
    });
  }
}
