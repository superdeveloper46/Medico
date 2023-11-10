import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { VisionVitalSigns } from '../../models/visionVitalSigns';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class VisionVitalSignsService {
  public emitVisionVitalSignsSave: Subject<VisionVitalSigns> = new Subject<VisionVitalSigns>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getById(visionVitalSignsId: string): Promise<VisionVitalSigns> {
    return firstValueFrom(
      this.http.get<VisionVitalSigns>(
        `${this.config.apiUrl}visionvitalsigns/${visionVitalSignsId}`
      )
    ).then(vitalSigns => {
      if (vitalSigns) {
        vitalSigns.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          vitalSigns.createDate
        );
      }

      return vitalSigns;
    });
  }

  save(visionVitalSigns: VisionVitalSigns) {
    this.emitVisionVitalSignsSave.next(visionVitalSigns);

    visionVitalSigns.createDate = DateHelper.jsLocalDateToSqlServerUtc(
      visionVitalSigns.createDate
    );
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}visionvitalsigns`, visionVitalSigns)
    );
  }

  getByPatientId(patientId: string): Promise<VisionVitalSigns[]> {
    return firstValueFrom(
      this.http.get<VisionVitalSigns[]>(
        `${this.config.apiUrl}visionvitalsigns/patient/${patientId}`
      )
    );
  }
}
