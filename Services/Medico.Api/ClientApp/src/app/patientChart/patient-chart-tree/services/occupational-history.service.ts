import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { OccupationalHistory } from '../../models/occupationalHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class OccupationalHistoryService {
  public emitOccupationalHistorySave: Subject<OccupationalHistory> = new Subject<OccupationalHistory>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<OccupationalHistory[]>(
        `${this.config.apiUrl}occupationalhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}occupationalhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(occupationalHistory: OccupationalHistory) {
    this.emitOccupationalHistorySave.next(occupationalHistory);

    occupationalHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      occupationalHistory.createDate
    );

    // occupationalHistory.start = DateHelper
    //     .jsLocalDateToSqlServerUtc(occupationalHistory.start);

    if (occupationalHistory.end)
      occupationalHistory.end = DateHelper.jsLocalDateToSqlServerUtc(
        occupationalHistory.end
      );

    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}occupationalhistory`,
        occupationalHistory
      )
    );
  }

  delete(occupationalHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.config.apiUrl}occupationalhistory/${occupationalHistoryId}`
      )
    );
  }

  getById(occupationalHistoryId: any) {
    return firstValueFrom(
      this.http.get<OccupationalHistory>(
        `${this.config.apiUrl}occupationalhistory/${occupationalHistoryId}`
      )
    ).then(occupationalHistory => {
      if (occupationalHistory) {
        occupationalHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          occupationalHistory.createDate
        );

        occupationalHistory.start = DateHelper.sqlServerUtcDateToLocalJsDate(
          occupationalHistory.start
        );

        if (occupationalHistory.end)
          occupationalHistory.end = DateHelper.sqlServerUtcDateToLocalJsDate(
            occupationalHistory.end
          );
      }

      return occupationalHistory;
    });
  }
}
