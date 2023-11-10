import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { SurgicalHistory } from '../../models/surgicalHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class SurgicalHistoryService {
  public emitSurgicalHistorySave: Subject<[SurgicalHistory, Array<any>]> = new Subject<[SurgicalHistory, Array<any>]>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<SurgicalHistory[]>(
        `${this.config.apiUrl}surgicalhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}surgicalhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(surgicalHistory: SurgicalHistory, icdCodeArr: Array<any>) {
    this.emitSurgicalHistorySave.next([surgicalHistory, icdCodeArr]);

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}surgicalhistory`, surgicalHistory)
    );
  }

  delete(surgicalHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}surgicalhistory/${surgicalHistoryId}`)
    );
  }

  getById(surgicalHistoryId: any) {
    return firstValueFrom(
      this.http.get<SurgicalHistory>(
        `${this.config.apiUrl}surgicalhistory/${surgicalHistoryId}`
      )
    ).then(surgicalHistory => {
      if (surgicalHistory) {
        surgicalHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          surgicalHistory.createDate
        );
      }

      return surgicalHistory;
    });
  }
}
