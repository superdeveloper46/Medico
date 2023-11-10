import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { PatientIdentificationCode } from '../models/patientIdentificationCode';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PatientIdentificationCodeSearchFilter } from '../models/PatientIdentificationCodeSearchFilter';
import { CreateUpdateResponse } from 'src/app/_models/createUpdateResponse';
import { PatientIdentificationCodeApiModel } from '../models/patientIdentificationCodeApiModel';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PatientIdentificationCodeService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  save(
    code: PatientIdentificationCodeApiModel
  ): Promise<CreateUpdateResponse<PatientIdentificationCodeApiModel>> {
    return firstValueFrom(
      this.http.post<CreateUpdateResponse<PatientIdentificationCodeApiModel>>(
        `${this.config.apiUrl}${ApiBaseUrls.patientIdentificationCodes}/`,
        code
      )
    );
  }

  get(
    searchFilter: PatientIdentificationCodeSearchFilter
  ): Promise<PatientIdentificationCodeApiModel> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });

    return firstValueFrom(
      this.http.get<PatientIdentificationCode>(
        `${this.config.apiUrl}${ApiBaseUrls.patientIdentificationCodes}/`,
        { params: queryParams }
      )
    );
  }
}
