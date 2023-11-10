import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { BaseVitalSigns } from '../../models/baseVitalSigns';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class BaseVitalSignsService {
  public emitBaseVitalSignsSave: Subject<BaseVitalSigns> = new Subject<BaseVitalSigns>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  save(baseVitalSigns: BaseVitalSigns): Promise<BaseVitalSigns> {
    this.emitBaseVitalSignsSave.next(baseVitalSigns);

    return firstValueFrom(
      this.http.post<BaseVitalSigns>(
        `${this.config.apiUrl}basevitalsigns`,
        baseVitalSigns
      )
    );
  }

  getByPatientId(patientId: string) {
    return firstValueFrom(
      this.http.get<BaseVitalSigns>(
        `${this.config.apiUrl}basevitalsigns/patient/${patientId}`
      )
    );
  }
}
