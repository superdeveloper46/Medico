import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PatientIdentificationCodeSearchFilter } from '../models/PatientIdentificationCodeSearchFilter';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PatientIdentificationNumericCodeService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  get(searchFilter: PatientIdentificationCodeSearchFilter): Promise<number> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });

    return firstValueFrom(
      this.http.get<number>(
        `${this.config.apiUrl}${ApiBaseUrls.patientIdentificationNmericCodes}/`,
        { params: queryParams }
      )
    );
  }
}
