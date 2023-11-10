import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { Allergy } from '../../models/allergy';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { AllergyOnMedication } from '../../models/allergyOnMedication';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class AllergyService {
  public emitAllergySave: Subject<[Allergy, any]> = new Subject<[Allergy, any]>;
  public emitSelectableLists: Subject<any> = new Subject<any>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getPatientAllergyOnMedication(
    patientId: string,
    medicationNameId: string
  ): Promise<AllergyOnMedication> {
    return firstValueFrom(
      this.http.get<AllergyOnMedication>(
        `${this.config.apiUrl}allergy/patient/${patientId}/medication/${medicationNameId}`
      )
    );
  }

  getAllByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<Allergy[]>(`${this.config.apiUrl}allergy/patient/${patientId}`)
    );
  }

  isHistoryExist(patientId: string) {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}allergy/allergyexistence/patient/${patientId}`
      )
    );
  }

  save(allergy: Allergy, data: any) {
    if (!data["medicationClasses"])
      data["medicationClasses"] = []
    if (!data["medicationNames"])
      data["medicationNames"] = []
  
    this.emitAllergySave.next([allergy, data]);

    allergy.createDate = DateHelper.jsLocalDateToSqlServerUtc(allergy.createDate);

    return firstValueFrom(this.http.post<void>(`${this.config.apiUrl}allergy`, allergy));
  }

  delete(allergyId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}allergy/${allergyId}`)
    );
  }

  getByPatientIdAndDate(patientId: string, currentDate: any): Promise<Allergy[]> {
    const utcDate = DateHelper.jsLocalDateToSqlServerUtc(currentDate);
    return firstValueFrom(
      this.http.get<Allergy[]>(
        `${this.config.apiUrl}allergy/patient/${patientId}/date/${utcDate}`
      )
    ).then(allergies => {
      if (allergies.length) {
        allergies.forEach(allergy => {
          allergy.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            allergy.createDate
          );
        });
      }

      return allergies;
    });
  }

  getById(allergyId: any) {
    return firstValueFrom(
      this.http.get<Allergy>(`${this.config.apiUrl}allergy/${allergyId}`)
    ).then(allergy => {
      if (allergy) {
        allergy.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(allergy.createDate);
      }

      return allergy;
    });
  }
}
