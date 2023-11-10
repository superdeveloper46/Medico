import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { VitalSigns } from '../../models/vitalSigns';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class VitalSignsService {
  public emitVitalSignsSave: Subject<VitalSigns> = new Subject<VitalSigns>();

  constructor(private http: HttpClient, private config: ConfigService) {}

  getLast(patientId: string, createdDate: any) {
    const serverDate = DateHelper.jsLocalDateToSqlServerUtc(createdDate);
    return firstValueFrom(
      this.http.get<VitalSigns>(
        `${this.config.apiUrl}vitalsigns/last/patient/${patientId}/date/${serverDate}`
      )
    );
  }

  save(vitalSigns: VitalSigns) {
    this.emitVitalSignsSave.next(vitalSigns);

    vitalSigns.createdDate = DateHelper.jsLocalDateToSqlServerUtc(vitalSigns.createdDate);

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}vitalsigns`, vitalSigns)
    );
  }

  delete(vitalSignsId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}vitalsigns/${vitalSignsId}`)
    );
  }

  getById(vitalSignsId: any) {
    return firstValueFrom(
      this.http.get<VitalSigns>(`${this.config.apiUrl}vitalsigns/${vitalSignsId}`)
    ).then(vitalSigns => {
      if (vitalSigns) {
        vitalSigns.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          vitalSigns.createdDate
        );
      }

      return vitalSigns;
    });
  }

  getByPatientAndAdmissionIds(
    patientId: string,
    admissionId: string
  ): Promise<VitalSigns[]> {
    return firstValueFrom(
      this.http.get<VitalSigns[]>(
        `${this.config.apiUrl}vitalsigns/patient/${patientId}/admission/${admissionId}`
      )
    ).then(vitalSignsList => {
      vitalSignsList.forEach(vitalSigns => {
        vitalSigns.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          vitalSigns.createdDate
        );
      });

      return vitalSignsList;
    });
  }

  getProblemList(appointmentId: string) {
    return firstValueFrom(
      this.http.get<any>(`${this.config.apiUrl}problemList/appointment/${appointmentId}`)
    );
  }

  getFromExpression(patientId: string, admissionId: string): Promise<string> {
    return firstValueFrom(
      this.http.get<string>(
        `${this.config.apiUrl}vitalsigns/expression/patient/${patientId}/admission/${admissionId}`
      )
    ).then(vitalSignsExpressionResult => {
      return vitalSignsExpressionResult;
    });
  }
}
