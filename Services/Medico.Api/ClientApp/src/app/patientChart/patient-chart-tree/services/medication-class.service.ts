import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { LookupModel } from 'src/app/_models/lookupModel';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MedicationClassService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getById(medicationClassId: string): Promise<LookupModel> {
    return firstValueFrom(
      this.http.get<LookupModel>(
        `${this.config.apiUrl}medicationclass/${medicationClassId}`
      )
    );
  }
}
