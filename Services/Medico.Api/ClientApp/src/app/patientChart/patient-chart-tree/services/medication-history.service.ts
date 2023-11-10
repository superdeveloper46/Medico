import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { MedicationHistory } from '../../models/medicationHistory';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class MedicationHistoryService {
  public emitMedicationHistorySave: Subject<[MedicationHistory, Array<any>]> = new Subject<[MedicationHistory, Array<any>]>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<MedicationHistory[]>(
        `${this.config.apiUrl}medicationhistory/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}medicationhistory/historyexistence/patient/${patientId}`
      )
    );
  }

  save(medicationHistory: MedicationHistory, medicationNames: Array<any>) {
    this.emitMedicationHistorySave.next([medicationHistory, medicationNames]);

    medicationHistory.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      medicationHistory.createDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}medicationhistory`, medicationHistory)
    );
  }

  delete(medicationHistoryId: string) {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.config.apiUrl}medicationhistory/${medicationHistoryId}`
      )
    );
  }

  getById(medicationHistoryId: any) {
    return firstValueFrom(
      this.http.get<MedicationHistory>(
        `${this.config.apiUrl}medicationhistory/${medicationHistoryId}`
      )
    ).then(medicationHistory => {
      if (medicationHistory) {
        medicationHistory.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          medicationHistory.createDate
        );
      }

      return medicationHistory;
    });
  }
}
