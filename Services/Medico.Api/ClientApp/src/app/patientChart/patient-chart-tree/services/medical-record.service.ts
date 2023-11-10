import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { MedicalRecord } from '../../models/medicalRecord';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class MedicalRecordService {
  public emitReviewedMedicalRecordSave: Subject<[MedicalRecord, any]> = new Subject<
    [MedicalRecord, any]
  >();

  constructor(private http: HttpClient, private config: ConfigService) {}

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<MedicalRecord[]>(
        `${this.config.apiUrl}medicalrecord/patient/${patientId}`
      )
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}medicalrecord/historyexistence/patient/${patientId}`
      )
    );
  }

  save(medicalRecord: MedicalRecord, icdCodes?: any): Promise<MedicalRecord> {
    if (!icdCodes) console.log('no icd codes loaded!!');
    else this.emitReviewedMedicalRecordSave.next([medicalRecord, icdCodes]);

    medicalRecord.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      medicalRecord.createDate
    );

    return firstValueFrom(
      this.http.post<MedicalRecord>(`${this.config.apiUrl}medicalrecord`, medicalRecord)
    );
  }

  delete(medicalRecordId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}medicalrecord/${medicalRecordId}`)
    );
  }

  getById(medicalRecordId: any) {
    return firstValueFrom(
      this.http.get<MedicalRecord>(
        `${this.config.apiUrl}medicalrecord/${medicalRecordId}`
      )
    ).then(medicalRecord => {
      if (medicalRecord) {
        medicalRecord.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          medicalRecord.createDate
        );
      }

      return medicalRecord;
    });
  }
}
