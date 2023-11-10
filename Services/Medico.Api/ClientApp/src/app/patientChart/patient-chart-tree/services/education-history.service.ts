import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { EducationHistory } from '../../models/educationHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class EducationHistoryService {
  public emitEducationHistorySave: Subject<EducationHistory> = new Subject<EducationHistory>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<EducationHistory[]>(
        `${this.config.apiUrl}educationhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}educationhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(educationHistory: EducationHistory) {
    this.emitEducationHistorySave.next(educationHistory);

    educationHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      educationHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}educationhistory`, educationHistory)
    );
  }

  delete(educationHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.config.apiUrl}educationhistory/${educationHistoryId}`
      )
    );
  }

  getById(educationHistoryId: any) {
    return firstValueFrom(
      this.http.get<EducationHistory>(
        `${this.config.apiUrl}educationhistory/${educationHistoryId}`
      )
    ).then(educationHistory => {
      if (educationHistory) {
        educationHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          educationHistory.createDate
        );
      }

      return educationHistory;
    });
  }
}
