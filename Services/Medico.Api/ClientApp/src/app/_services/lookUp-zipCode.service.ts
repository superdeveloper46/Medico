import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { LookUpZipCode } from '../_models/lookUpZipCode';
import { LookUpZipCodeSearchFilter } from '../administration/models/lookUpZipCodeSearchFilter';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LookUpZipCodeService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  public getByFilter(searchFilter: LookUpZipCodeSearchFilter): Promise<LookUpZipCode[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });

    return firstValueFrom(
      this.http.get<LookUpZipCode[]>(
        `${this.config.apiUrl}${ApiBaseUrls.lookUpZipCode}`,
        {
          params: queryParams,
        }
      )
    );
  }

  getFirst(): Promise<LookUpZipCode> {
    const filter = this.getFirstActiveFilter();

    return this.getByFilter(filter).then(companies => companies[0]);
  }

  getByAppointmentId(appointmentId: string): Promise<LookUpZipCode> {
    const filter = this.getByAppointmentIdFilter(appointmentId);

    return this.getByFilter(filter).then(companies => companies[0]);
  }

  getById(id: string): Promise<LookUpZipCode> {
    return firstValueFrom(
      this.http.get<LookUpZipCode>(
        `${this.config.apiUrl}${ApiBaseUrls.lookUpZipCode}/${id}`
      )
    );
  }

  getByCompanyId(Cid: string): Promise<LookUpZipCode> {
    return firstValueFrom(
      this.http.get<LookUpZipCode>(
        `${this.config.apiUrl}${ApiBaseUrls.lookUpZipCode}/GCompany/${Cid}`
      )
    );
  }

  save(lookUpZipCode: LookUpZipCode): Promise<LookUpZipCode> {
    return firstValueFrom(
      this.http.post<LookUpZipCode>(
        `${this.config.apiUrl}${ApiBaseUrls.lookUpZipCode}/`,
        lookUpZipCode
      )
    );
  }

  private getFirstActiveFilter(): LookUpZipCodeSearchFilter {
    const filter = new LookUpZipCodeSearchFilter();

    filter.isActive = true;
    filter.take = 1;

    return filter;
  }

  private getByAppointmentIdFilter(appointmentId: string): LookUpZipCodeSearchFilter {
    const filter = new LookUpZipCodeSearchFilter();

    filter.appointmentId = appointmentId;
    filter.take = 1;

    return filter;
  }
}
